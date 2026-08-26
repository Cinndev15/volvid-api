import QRCode from "qrcode";
import pool from "../config/db.js";

// Ensure lost_pet_reports table exists
const ensureLostReportsTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lost_pet_reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pet_id INT NOT NULL,
        owner_id INT NOT NULL,
        status ENUM("active", "resolved", "cancelled") DEFAULT "active",
        lost_date DATE NOT NULL,
        lost_location VARCHAR(255) NOT NULL,
        contact_phone VARCHAR(50) NOT NULL,
        reward VARCHAR(100) NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP NULL DEFAULT NULL,
        FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
        FOREIGN KEY (owner_id) REFERENCES pet_owners(id) ON DELETE CASCADE
      )
    `);
  } catch (err) {
    console.error("Error creating lost_pet_reports table:", err.message);
  }
};

ensureLostReportsTable();

/**
 * Register a new pet associated with an owner, generating a unique QR code
 * 
 * @param {object} petData Pet parameters (name, type, breed_id, photo_url, etc.)
 * @param {number} ownerId Owner ID from JWT
 * @returns {Promise<object>} Created pet details including qr_code
 */
export const createPet = async (petData, ownerId) => {
  const { name, type, breed_id, photo_url, age, fur_color, temperament, status, observations } = petData;

  // 1. Verify breed exists and matches type
  const [breeds] = await pool.query(
    "SELECT id, name FROM breeds WHERE id = ? AND type = ?",
    [breed_id, type]
  );

  if (breeds.length === 0) {
    throw new Error("INVALID_BREED");
  }

  // 2. Insert pet into database (without QR initially)
  const [insertResult] = await pool.query(
    `INSERT INTO pets (owner_id, breed_id, name, type, photo_url, age, fur_color, temperament, status, observations) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      ownerId,
      breed_id,
      name,
      type,
      photo_url || null,
      age || null,
      fur_color || null,
      temperament || null,
      status || "active",
      observations || null
    ]
  );

  const newPetId = insertResult.insertId;

  // 3. Generate QR code with pet identification data
  const qrPayload = JSON.stringify({
    pet_id: newPetId,
    owner_id: ownerId,
    name: name,
    type: type,
    breed: breeds[0].name
  });

  const qrCodeBase64 = await QRCode.toDataURL(qrPayload, {
    width: 300,
    margin: 2,
    color: {
      dark: "#1B4332",  // Volvid dark green
      light: "#FFFFFF"
    }
  });

  // 4. Save QR code in the database
  await pool.query(
    "UPDATE pets SET qr_code = ? WHERE id = ?",
    [qrCodeBase64, newPetId]
  );

  // 5. Fetch and return complete pet details
  const [pets] = await pool.query(
    `SELECT p.*, b.name as breed_name 
     FROM pets p 
     INNER JOIN breeds b ON p.breed_id = b.id 
     WHERE p.id = ?`,
    [newPetId]
  );

  return pets[0];
};

/**
 * Retrieve all pets belonging to a specific owner, including active lost status
 * 
 * @param {number} ownerId Owner ID
 * @returns {Promise<Array>} List of pets
 */
export const getPetsByOwner = async (ownerId) => {
  await ensureLostReportsTable();
  const [pets] = await pool.query(
    `SELECT p.*, b.name as breed_name,
            IF(lr.id IS NOT NULL, 1, 0) as is_lost,
            lr.id as lost_report_id,
            lr.lost_date,
            lr.lost_location,
            lr.contact_phone as lost_contact,
            lr.reward as lost_reward,
            lr.notes as lost_notes
     FROM pets p 
     INNER JOIN breeds b ON p.breed_id = b.id 
     LEFT JOIN lost_pet_reports lr ON p.id = lr.pet_id AND lr.status = "active"
     WHERE p.owner_id = ? 
     ORDER BY p.created_at DESC`,
    [ownerId]
  );
  return pets;
};

/**
 * Report a pet as lost (creates/activates lost report)
 * 
 * @param {number} petId Pet ID
 * @param {number} ownerId Owner ID from JWT
 * @param {object} reportData { lost_location, lost_date, contact_phone, reward, notes }
 * @returns {Promise<object>} Created lost report
 */
export const reportLostPetService = async (petId, ownerId, reportData) => {
  await ensureLostReportsTable();
  const { lost_location, lost_date, contact_phone, reward, notes } = reportData;

  // 1. Verify pet belongs to owner
  const [pets] = await pool.query(
    "SELECT id, name, type FROM pets WHERE id = ? AND owner_id = ?",
    [petId, ownerId]
  );

  if (pets.length === 0) {
    throw new Error("PET_NOT_FOUND_OR_UNAUTHORIZED");
  }

  // 2. Cancel previous active reports for this pet if any
  await pool.query(
    "UPDATE lost_pet_reports SET status = 'cancelled' WHERE pet_id = ? AND status = 'active'",
    [petId]
  );

  // 3. Insert new active report
  const effectiveDate = lost_date || new Date().toISOString().substring(0, 10);
  const [result] = await pool.query(
    `INSERT INTO lost_pet_reports (pet_id, owner_id, status, lost_date, lost_location, contact_phone, reward, notes)
     VALUES (?, ?, "active", ?, ?, ?, ?, ?)`,
    [
      petId,
      ownerId,
      effectiveDate,
      lost_location,
      contact_phone,
      reward || null,
      notes || null
    ]
  );

  // 4. Return created report
  const [reports] = await pool.query(
    `SELECT lr.*, p.name as pet_name, p.type as pet_type, b.name as breed_name, p.photo_url, p.fur_color
     FROM lost_pet_reports lr
     INNER JOIN pets p ON lr.pet_id = p.id
     INNER JOIN breeds b ON p.breed_id = b.id
     WHERE lr.id = ?`,
    [result.insertId]
  );

  return reports[0];
};

/**
 * Mark a pet as found (resolves active lost report)
 * 
 * @param {number} petId Pet ID
 * @param {number} ownerId Owner ID from JWT
 * @returns {Promise<object>} Result
 */
export const markPetAsFoundService = async (petId, ownerId) => {
  await ensureLostReportsTable();

  // 1. Verify pet belongs to owner
  const [pets] = await pool.query(
    "SELECT id, name FROM pets WHERE id = ? AND owner_id = ?",
    [petId, ownerId]
  );

  if (pets.length === 0) {
    throw new Error("PET_NOT_FOUND_OR_UNAUTHORIZED");
  }

  // 2. Resolve active reports
  const [updateResult] = await pool.query(
    `UPDATE lost_pet_reports 
     SET status = "resolved", resolved_at = CURRENT_TIMESTAMP 
     WHERE pet_id = ? AND status = "active"`,
    [petId]
  );

  return {
    pet_id: parseInt(petId),
    pet_name: pets[0].name,
    is_lost: false,
    reports_resolved: updateResult.affectedRows
  };
};

/**
 * Get all currently lost pets (Public Community Feed)
 * 
 * @returns {Promise<Array>} List of lost pets
 */
export const getAllLostPetsService = async () => {
  await ensureLostReportsTable();
  const [lostPets] = await pool.query(
    `SELECT lr.id as report_id,
            lr.pet_id,
            lr.lost_date,
            lr.lost_location,
            lr.contact_phone,
            lr.reward,
            lr.notes,
            lr.created_at as reported_at,
            p.name as pet_name,
            p.type as pet_type,
            b.name as breed_name,
            p.photo_url,
            p.age,
            p.fur_color,
            p.temperament,
            p.qr_code,
            o.full_name as owner_name,
            o.email as owner_email
     FROM lost_pet_reports lr
     INNER JOIN pets p ON lr.pet_id = p.id
     INNER JOIN breeds b ON p.breed_id = b.id
     INNER JOIN pet_owners o ON lr.owner_id = o.id
     WHERE lr.status = "active"
     ORDER BY lr.created_at DESC`
  );
  return lostPets;
};

/**
 * Get active lost report for a specific pet
 * 
 * @param {number} petId Pet ID
 * @returns {Promise<object|null>} Report details or null
 */
export const getPetLostReportService = async (petId) => {
  await ensureLostReportsTable();
  const [reports] = await pool.query(
    `SELECT lr.*,
            p.name as pet_name,
            p.type as pet_type,
            b.name as breed_name,
            p.photo_url,
            p.age,
            p.fur_color,
            p.temperament,
            p.qr_code,
            o.full_name as owner_name,
            o.email as owner_email
     FROM lost_pet_reports lr
     INNER JOIN pets p ON lr.pet_id = p.id
     INNER JOIN breeds b ON p.breed_id = b.id
     INNER JOIN pet_owners o ON lr.owner_id = o.id
     WHERE lr.pet_id = ? AND lr.status = "active"
     LIMIT 1`,
    [petId]
  );
  return reports[0] || null;
};

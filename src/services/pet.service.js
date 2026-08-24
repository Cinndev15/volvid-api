import QRCode from 'qrcode';
import pool from '../config/db.js';

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
    'SELECT id, name FROM breeds WHERE id = ? AND type = ?',
    [breed_id, type]
  );

  if (breeds.length === 0) {
    throw new Error('INVALID_BREED');
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
      status || 'active',
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
      dark: '#1B4332',  // Volvid dark green
      light: '#FFFFFF'
    }
  });

  // 4. Save QR code in the database
  await pool.query(
    'UPDATE pets SET qr_code = ? WHERE id = ?',
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
 * Retrieve all pets belonging to a specific owner
 * 
 * @param {number} ownerId Owner ID
 * @returns {Promise<Array>} List of pets
 */
export const getPetsByOwner = async (ownerId) => {
  const [pets] = await pool.query(
    `SELECT p.*, b.name as breed_name 
     FROM pets p 
     INNER JOIN breeds b ON p.breed_id = b.id 
     WHERE p.owner_id = ? 
     ORDER BY p.created_at DESC`,
    [ownerId]
  );
  return pets;
};

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';
import pool from '../config/db.js';
import config from '../config/config.js';

// Auto-ensure volvid_admins table exists in database
export const ensureVolvidAdminsTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS volvid_admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NULL,
        role ENUM('superadmin', 'admin', 'support') DEFAULT 'superadmin',
        status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
        avatar_url VARCHAR(500) NULL,
        last_login_at TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_volvid_admin_email (email),
        INDEX idx_volvid_admin_status (status)
      )
    `);
  } catch (err) {
    console.error('Error al inicializar la tabla volvid_admins:', err.message);
  }
};

// Initialize table on module load
ensureVolvidAdminsTable();

/**
 * Register a new Volvid platform administrator
 */
export const registerVolvidAdmin = async (adminData) => {
  const {
    full_name,
    email,
    password,
    phone = null,
    role = 'superadmin',
    avatar_url = null
  } = adminData;

  const normalizedEmail = email.toLowerCase().trim();

  // 1. Check if email is already registered
  const [existing] = await pool.query(
    'SELECT id FROM volvid_admins WHERE email = ?',
    [normalizedEmail]
  );

  if (existing.length > 0) {
    throw new Error('EMAIL_EXISTS');
  }

  // 2. Hash password securely
  const saltRounds = 10;
  const password_hash = await bcrypt.hash(password, saltRounds);

  // 3. Insert new admin
  const validRoles = ['superadmin', 'admin', 'support'];
  const assignedRole = validRoles.includes(role) ? role : 'superadmin';

  const [result] = await pool.query(
    `INSERT INTO volvid_admins 
     (full_name, email, password_hash, phone, role, status, avatar_url) 
     VALUES (?, ?, ?, ?, ?, 'active', ?)`,
    [
      full_name.trim(),
      normalizedEmail,
      password_hash,
      phone ? phone.trim() : null,
      assignedRole,
      avatar_url ? avatar_url.trim() : null
    ]
  );

  const adminId = result.insertId;

  return {
    id: adminId,
    full_name: full_name.trim(),
    email: normalizedEmail,
    phone: phone ? phone.trim() : null,
    role: assignedRole,
    status: 'active',
    avatar_url: avatar_url ? avatar_url.trim() : null,
    created_at: new Date()
  };
};

/**
 * Authenticate Volvid platform administrator and issue JWT
 */
export const authenticateVolvidAdmin = async (email, password) => {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Find administrator by email
  const [admins] = await pool.query(
    'SELECT * FROM volvid_admins WHERE email = ?',
    [normalizedEmail]
  );

  if (admins.length === 0) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const admin = admins[0];

  // 2. Verify password match
  const isMatch = await bcrypt.compare(password, admin.password_hash);
  if (!isMatch) {
    throw new Error('INVALID_CREDENTIALS');
  }

  // 3. Verify admin account status
  if (admin.status === 'inactive') {
    throw new Error('ACCOUNT_INACTIVE');
  }

  if (admin.status === 'suspended') {
    throw new Error('ACCOUNT_SUSPENDED');
  }

  // 4. Update last_login_at timestamp
  await pool.query(
    'UPDATE volvid_admins SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
    [admin.id]
  );

  // 5. Generate secure JWT token
  const token = jwt.sign(
    {
      adminId: admin.id,
      email: admin.email,
      role: 'volvid_admin',
      adminRole: admin.role
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.expiresIn
    }
  );

  return {
    token,
    admin: {
      id: admin.id,
      full_name: admin.full_name,
      email: admin.email,
      phone: admin.phone,
      role: admin.role,
      status: admin.status,
      avatar_url: admin.avatar_url,
      last_login_at: new Date()
    }
  };
};

/**
 * Get administrator profile by ID
 */
export const getVolvidAdminProfile = async (adminId) => {
  const [admins] = await pool.query(
    'SELECT id, full_name, email, phone, role, status, avatar_url, last_login_at, created_at, updated_at FROM volvid_admins WHERE id = ?',
    [adminId]
  );

  if (admins.length === 0) {
    throw new Error('ADMIN_NOT_FOUND');
  }

  return admins[0];
};

/**
 * List all platform administrators
 */
export const listVolvidAdmins = async () => {
  const [admins] = await pool.query(
    'SELECT id, full_name, email, phone, role, status, avatar_url, last_login_at, created_at, updated_at FROM volvid_admins ORDER BY created_at DESC'
  );

  return admins;
};

/**
 * Update administrator status
 */
export const updateVolvidAdminStatus = async (adminId, status) => {
  const validStatuses = ['active', 'inactive', 'suspended'];
  if (!validStatuses.includes(status)) {
    throw new Error('INVALID_STATUS');
  }

  const [result] = await pool.query(
    'UPDATE volvid_admins SET status = ? WHERE id = ?',
    [status, adminId]
  );

  if (result.affectedRows === 0) {
    throw new Error('ADMIN_NOT_FOUND');
  }

  return getVolvidAdminProfile(adminId);
};

/**
 * Helper to generate and persist QR code for a pet if missing
 */
export const ensurePetQrCode = async (petId, petName, breedName, ownerId) => {
  const qrCodeFormatted = `VOL-QR-${String(petId).padStart(5, '0')}`;
  const qrPayload = JSON.stringify({
    pet_id: petId,
    qr_code: qrCodeFormatted,
    name: petName,
    breed: breedName,
    owner_id: ownerId,
    public_url: `https://volvidmascotas.com/pet/${petId}`
  });

  const qrCodeBase64 = await QRCode.toDataURL(qrPayload, {
    width: 350,
    margin: 2,
    color: {
      dark: '#1B4332',
      light: '#FFFFFF'
    }
  });

  await pool.query('UPDATE pets SET qr_code = ? WHERE id = ?', [qrCodeBase64, petId]);
  return { qrCodeBase64, qrCodeFormatted, qrPayload };
};

/**
 * List all registered pets with full owner, breed, lost status and QR information
 */
export const listVolvidPetsAdmin = async (filters = {}) => {
  const { search, status, type } = filters;

  let query = `
    SELECT 
      p.id,
      p.owner_id,
      p.breed_id,
      p.name,
      p.type,
      p.photo_url,
      p.age,
      p.fur_color,
      p.temperament,
      p.status,
      p.observations,
      p.qr_code,
      p.created_at,
      p.updated_at,
      b.name as breed_name,
      o.full_name as owner_name,
      o.email as owner_email,
      o.avatar_url as owner_avatar,
      IF(lr.id IS NOT NULL, 1, 0) as is_lost,
      lr.id as lost_report_id,
      lr.lost_date,
      lr.lost_location,
      lr.contact_phone as lost_contact,
      lr.reward as lost_reward,
      lr.notes as lost_notes,
      lr.status as lost_status,
      (SELECT COUNT(*) FROM medical_records mr WHERE mr.pet_id = p.id) as medical_records_count,
      (SELECT COUNT(*) FROM appointments ap WHERE ap.pet_id = p.id) as appointments_count
    FROM pets p
    INNER JOIN breeds b ON p.breed_id = b.id
    INNER JOIN pet_owners o ON p.owner_id = o.id
    LEFT JOIN lost_pet_reports lr ON p.id = lr.pet_id AND lr.status = 'active'
    WHERE 1=1
  `;

  const params = [];

  if (search) {
    query += ` AND (
      p.name LIKE ? OR 
      b.name LIKE ? OR 
      o.full_name LIKE ? OR 
      o.email LIKE ? OR
      CONCAT('VOL-QR-', LPAD(p.id, 5, '0')) LIKE ?
    )`;
    const searchPattern = `%${search.trim()}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
  }

  if (type && ['dog', 'cat'].includes(type)) {
    query += ` AND p.type = ?`;
    params.push(type);
  }

  if (status) {
    if (status.toLowerCase() === 'lost' || status.toLowerCase() === 'extraviado') {
      query += ` AND lr.id IS NOT NULL AND lr.status = 'active'`;
    } else if (['active', 'inactive'].includes(status.toLowerCase())) {
      query += ` AND p.status = ?`;
      params.push(status.toLowerCase());
    }
  }

  query += ` ORDER BY p.created_at DESC`;

  const [pets] = await pool.query(query, params);

  // Format and ensure QR codes are populated
  const formattedPets = await Promise.all(
    pets.map(async (pet) => {
      let qrBase64 = pet.qr_code;
      const qrCodeFormatted = `VOL-QR-${String(pet.id).padStart(5, '0')}`;

      if (!qrBase64) {
        try {
          const gen = await ensurePetQrCode(pet.id, pet.name, pet.breed_name, pet.owner_id);
          qrBase64 = gen.qrCodeBase64;
        } catch (e) {
          console.error(`Error auto-generating QR for pet ${pet.id}:`, e.message);
        }
      }

      return {
        id: pet.id,
        qr_code_formatted: qrCodeFormatted,
        qr_code: qrBase64,
        name: pet.name,
        type: pet.type,
        species: pet.type === 'dog' ? 'Perro' : 'Gato',
        breed_id: pet.breed_id,
        breed_name: pet.breed_name,
        photo_url: pet.photo_url,
        age: pet.age || 'No especificada',
        fur_color: pet.fur_color || 'No especificado',
        temperament: pet.temperament || 'Normal',
        status: pet.status,
        observations: pet.observations,
        is_lost: Boolean(pet.is_lost),
        lost_details: pet.is_lost ? {
          report_id: pet.lost_report_id,
          lost_date: pet.lost_date,
          lost_location: pet.lost_location,
          contact_phone: pet.lost_contact,
          reward: pet.lost_reward,
          notes: pet.lost_notes
        } : null,
        owner: {
          id: pet.owner_id,
          name: pet.owner_name,
          email: pet.owner_email,
          avatar: pet.owner_avatar
        },
        stats: {
          medical_records: pet.medical_records_count,
          appointments: pet.appointments_count
        },
        created_at: pet.created_at,
        updated_at: pet.updated_at
      };
    })
  );

  return formattedPets;
};

/**
 * Get detailed information for a single pet by ID
 */
export const getVolvidPetDetailsAdmin = async (petId) => {
  const [pets] = await pool.query(
    `SELECT 
      p.*,
      b.name as breed_name,
      o.full_name as owner_name,
      o.email as owner_email,
      o.avatar_url as owner_avatar,
      o.created_at as owner_registered_at,
      IF(lr.id IS NOT NULL, 1, 0) as is_lost,
      lr.id as lost_report_id,
      lr.lost_date,
      lr.lost_location,
      lr.contact_phone as lost_contact,
      lr.reward as lost_reward,
      lr.notes as lost_notes,
      lr.status as lost_status
    FROM pets p
    INNER JOIN breeds b ON p.breed_id = b.id
    INNER JOIN pet_owners o ON p.owner_id = o.id
    LEFT JOIN lost_pet_reports lr ON p.id = lr.pet_id AND lr.status = 'active'
    WHERE p.id = ?`,
    [petId]
  );

  if (pets.length === 0) {
    throw new Error('PET_NOT_FOUND');
  }

  const pet = pets[0];
  let qrBase64 = pet.qr_code;
  const qrCodeFormatted = `VOL-QR-${String(pet.id).padStart(5, '0')}`;

  if (!qrBase64) {
    const gen = await ensurePetQrCode(pet.id, pet.name, pet.breed_name, pet.owner_id);
    qrBase64 = gen.qrCodeBase64;
  }

  // Fetch clinic history
  const [clinicPatients] = await pool.query(
    `SELECT cp.*, c.name as clinic_name, c.phone as clinic_phone, c.city as clinic_city
     FROM clinic_patients cp
     INNER JOIN clinics c ON cp.clinic_id = c.id
     WHERE cp.pet_id = ?`,
    [petId]
  );

  // Fetch medical records
  const [medicalRecords] = await pool.query(
    `SELECT mr.*, c.name as clinic_name, v.full_name as vet_name
     FROM medical_records mr
     INNER JOIN clinics c ON mr.clinic_id = c.id
     LEFT JOIN veterinarians v ON mr.vet_id = v.id
     WHERE mr.pet_id = ?
     ORDER BY mr.created_at DESC`,
    [petId]
  );

  // Fetch appointments
  const [appointments] = await pool.query(
    `SELECT ap.*, c.name as clinic_name, v.full_name as vet_name
     FROM appointments ap
     INNER JOIN clinics c ON ap.clinic_id = c.id
     LEFT JOIN veterinarians v ON ap.vet_id = v.id
     WHERE ap.pet_id = ?
     ORDER BY ap.appointment_date DESC, ap.appointment_time DESC`,
    [petId]
  );

  return {
    id: pet.id,
    qr_code_formatted: qrCodeFormatted,
    qr_code: qrBase64,
    qr_payload: {
      pet_id: pet.id,
      qr_code: qrCodeFormatted,
      name: pet.name,
      breed: pet.breed_name,
      owner_id: pet.owner_id,
      public_url: `https://volvidmascotas.com/pet/${pet.id}`
    },
    name: pet.name,
    type: pet.type,
    species: pet.type === 'dog' ? 'Perro' : 'Gato',
    breed_id: pet.breed_id,
    breed_name: pet.breed_name,
    photo_url: pet.photo_url,
    age: pet.age || 'No especificada',
    fur_color: pet.fur_color || 'No especificado',
    temperament: pet.temperament || 'Normal',
    status: pet.status,
    observations: pet.observations,
    is_lost: Boolean(pet.is_lost),
    lost_details: pet.is_lost ? {
      report_id: pet.lost_report_id,
      lost_date: pet.lost_date,
      lost_location: pet.lost_location,
      contact_phone: pet.lost_contact,
      reward: pet.lost_reward,
      notes: pet.lost_notes
    } : null,
    owner: {
      id: pet.owner_id,
      name: pet.owner_name,
      email: pet.owner_email,
      avatar: pet.owner_avatar,
      registered_at: pet.owner_registered_at
    },
    clinics: clinicPatients,
    medical_records: medicalRecords,
    appointments: appointments,
    created_at: pet.created_at,
    updated_at: pet.updated_at
  };
};

/**
 * Get or regenerate QR Code for a specific pet
 */
export const getVolvidPetQrAdmin = async (petId) => {
  const [pets] = await pool.query(
    `SELECT p.id, p.name, p.owner_id, b.name as breed_name, p.qr_code
     FROM pets p
     INNER JOIN breeds b ON p.breed_id = b.id
     WHERE p.id = ?`,
    [petId]
  );

  if (pets.length === 0) {
    throw new Error('PET_NOT_FOUND');
  }

  const pet = pets[0];
  let qrBase64 = pet.qr_code;
  const qrCodeFormatted = `VOL-QR-${String(pet.id).padStart(5, '0')}`;
  const publicUrl = `https://volvidmascotas.com/pet/${pet.id}`;

  if (!qrBase64) {
    const gen = await ensurePetQrCode(pet.id, pet.name, pet.breed_name, pet.owner_id);
    qrBase64 = gen.qrCodeBase64;
  }

  return {
    pet_id: pet.id,
    pet_name: pet.name,
    breed_name: pet.breed_name,
    qr_code_formatted: qrCodeFormatted,
    qr_code_image: qrBase64,
    public_url: publicUrl,
    download_filename: `${qrCodeFormatted}-${pet.name.replace(/\s+/g, '_')}-volvid-qr.png`
  };
};

/**
 * List all registered pet owners (users) with their stats
 */
export const listVolvidOwnersAdmin = async (filters = {}) => {
  const { search } = filters;
  let query = `
    SELECT 
      o.id,
      o.full_name,
      o.email,
      o.avatar_url,
      o.google_id,
      o.terms_accepted,
      o.created_at,
      COUNT(p.id) as total_pets
    FROM pet_owners o
    LEFT JOIN pets p ON o.id = p.owner_id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    query += ` AND (o.full_name LIKE ? OR o.email LIKE ?)`;
    const pattern = `%${search.trim()}%`;
    params.push(pattern, pattern);
  }

  query += ` GROUP BY o.id ORDER BY o.created_at DESC`;

  const [owners] = await pool.query(query, params);
  return owners;
};

/**
 * List all registered veterinary clinics with veterinary counts and linked patients
 */
export const listVolvidClinicsAdmin = async (filters = {}) => {
  const { search, status, city } = filters;
  let query = `
    SELECT 
      c.id,
      c.name,
      c.phone,
      c.size,
      c.country,
      c.state,
      c.city,
      c.status,
      c.trial_start,
      c.trial_end,
      c.created_at,
      COUNT(DISTINCT v.id) as total_vets,
      COUNT(DISTINCT cp.pet_id) as total_patients,
      COUNT(DISTINCT mr.id) as total_medical_records,
      COUNT(DISTINCT ap.id) as total_appointments
    FROM clinics c
    LEFT JOIN veterinarians v ON c.id = v.clinic_id
    LEFT JOIN clinic_patients cp ON c.id = cp.clinic_id
    LEFT JOIN medical_records mr ON c.id = mr.clinic_id
    LEFT JOIN appointments ap ON c.id = ap.clinic_id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    query += ` AND (c.name LIKE ? OR c.city LIKE ? OR c.phone LIKE ?)`;
    const pattern = `%${search.trim()}%`;
    params.push(pattern, pattern, pattern);
  }

  if (status) {
    query += ` AND c.status = ?`;
    params.push(status);
  }

  if (city) {
    query += ` AND c.city LIKE ?`;
    params.push(`%${city.trim()}%`);
  }

  query += ` GROUP BY c.id ORDER BY c.created_at DESC`;

  const [clinics] = await pool.query(query, params);
  return clinics;
};

/**
 * List all veterinarians registered across clinics
 */
export const listVolvidVeterinariansAdmin = async (filters = {}) => {
  const { search, clinic_id } = filters;
  let query = `
    SELECT 
      v.id,
      v.clinic_id,
      v.full_name,
      v.document_number,
      v.professional_card,
      v.specialty,
      v.phone,
      v.email,
      v.status,
      v.created_at,
      c.name as clinic_name,
      c.city as clinic_city
    FROM veterinarians v
    INNER JOIN clinics c ON v.clinic_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    query += ` AND (v.full_name LIKE ? OR v.professional_card LIKE ? OR v.email LIKE ? OR c.name LIKE ?)`;
    const pattern = `%${search.trim()}%`;
    params.push(pattern, pattern, pattern, pattern);
  }

  if (clinic_id) {
    query += ` AND v.clinic_id = ?`;
    params.push(clinic_id);
  }

  query += ` ORDER BY v.created_at DESC`;

  const [vets] = await pool.query(query, params);
  return vets;
};

/**
 * List all service providers (walkers / transporters)
 */
export const listVolvidServiceProvidersAdmin = async (filters = {}) => {
  const { search, service_type, status } = filters;
  let query = `SELECT * FROM service_providers WHERE 1=1`;
  const params = [];

  if (search) {
    query += ` AND (full_name LIKE ? OR email LIKE ? OR phone LIKE ? OR city LIKE ?)`;
    const pattern = `%${search.trim()}%`;
    params.push(pattern, pattern, pattern, pattern);
  }

  if (service_type) {
    query += ` AND service_type = ?`;
    params.push(service_type);
  }

  if (status) {
    query += ` AND status = ?`;
    params.push(status);
  }

  query += ` ORDER BY created_at DESC`;

  const [providers] = await pool.query(query, params);
  return providers;
};

/**
 * Get comprehensive platform metrics for dashboard overview
 */
export const getVolvidAdminDashboardStats = async () => {
  const [[{ total_pets }]] = await pool.query('SELECT COUNT(*) as total_pets FROM pets');
  const [[{ total_owners }]] = await pool.query('SELECT COUNT(*) as total_owners FROM pet_owners');
  const [[{ total_clinics }]] = await pool.query('SELECT COUNT(*) as total_clinics FROM clinics');
  const [[{ total_vets }]] = await pool.query('SELECT COUNT(*) as total_vets FROM veterinarians');
  const [[{ total_lost_active }]] = await pool.query('SELECT COUNT(*) as total_lost_active FROM lost_pet_reports WHERE status = "active"');
  const [[{ total_service_providers }]] = await pool.query('SELECT COUNT(*) as total_service_providers FROM service_providers');
  const [[{ total_medical_records }]] = await pool.query('SELECT COUNT(*) as total_medical_records FROM medical_records');
  const [[{ total_appointments }]] = await pool.query('SELECT COUNT(*) as total_appointments FROM appointments');

  const [recentPets] = await pool.query(`
    SELECT p.id, p.name, p.type, p.created_at, b.name as breed_name, o.full_name as owner_name
    FROM pets p
    INNER JOIN breeds b ON p.breed_id = b.id
    INNER JOIN pet_owners o ON p.owner_id = o.id
    ORDER BY p.created_at DESC
    LIMIT 5
  `);

  const [recentLost] = await pool.query(`
    SELECT lr.id, lr.lost_date, lr.lost_location, lr.created_at, p.name as pet_name, b.name as breed_name, o.full_name as owner_name
    FROM lost_pet_reports lr
    INNER JOIN pets p ON lr.pet_id = p.id
    INNER JOIN breeds b ON p.breed_id = b.id
    INNER JOIN pet_owners o ON lr.owner_id = o.id
    WHERE lr.status = 'active'
    ORDER BY lr.created_at DESC
    LIMIT 5
  `);

  return {
    metrics: {
      total_pets,
      total_owners,
      total_clinics,
      total_vets,
      total_lost_active,
      total_service_providers,
      total_medical_records,
      total_appointments,
      active_qrs_count: total_pets
    },
    recent_pets: recentPets.map(p => ({
      ...p,
      qr_code: `VOL-QR-${String(p.id).padStart(5, '0')}`
    })),
    recent_lost: recentLost
  };
};

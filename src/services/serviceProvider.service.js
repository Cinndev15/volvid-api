import pool from '../config/db.js';

// Ensure service_providers table exists
const ensureServiceProvidersTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS service_providers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        document_type VARCHAR(50) NOT NULL DEFAULT 'Cédula de Ciudadanía',
        document_number VARCHAR(100) NOT NULL,
        service_type ENUM('walker', 'transporter', 'both') NOT NULL,
        city VARCHAR(100) NOT NULL,
        coverage_areas VARCHAR(255) NULL,
        experience_years INT DEFAULT 0,
        vehicle_type VARCHAR(100) NULL,
        vehicle_plate VARCHAR(50) NULL,
        bio_description TEXT NULL,
        hourly_rate DECIMAL(10,2) NULL,
        document_id_front_url LONGTEXT NULL,
        document_id_back_url LONGTEXT NULL,
        criminal_record_doc_url LONGTEXT NULL,
        driver_license_doc_url LONGTEXT NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        terms_accepted BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_provider_email (email),
        INDEX idx_provider_service_type (service_type),
        INDEX idx_provider_status (status)
      )
    `);
  } catch (err) {
    console.error('Error al inicializar la tabla service_providers:', err.message);
  }
};

ensureServiceProvidersTable();

/**
 * Register a new service provider (walker / transporter / both)
 */
export const registerProvider = async (providerData, userId = null) => {
  const {
    full_name,
    email,
    phone,
    document_type = 'Cédula de Ciudadanía',
    document_number,
    service_type,
    city,
    coverage_areas = '',
    experience_years = 0,
    vehicle_type = null,
    vehicle_plate = null,
    bio_description = '',
    hourly_rate = null,
    document_id_front_url = null,
    document_id_back_url = null,
    criminal_record_doc_url = null,
    driver_license_doc_url = null,
    terms_accepted = true
  } = providerData;

  // Check if an application already exists with this email or document_number
  const [existing] = await pool.query(
    'SELECT id, email, service_type, status FROM service_providers WHERE email = ? OR document_number = ? LIMIT 1',
    [email, document_number]
  );

  if (existing.length > 0) {
    const prev = existing[0];
    if (prev.status === 'pending') {
      throw new Error('Ya existe una postulación en revisión con este correo o número de documento.');
    }
  }

  const [result] = await pool.query(
    `INSERT INTO service_providers 
    (user_id, full_name, email, phone, document_type, document_number, service_type, city, coverage_areas, 
     experience_years, vehicle_type, vehicle_plate, bio_description, hourly_rate, 
     document_id_front_url, document_id_back_url, criminal_record_doc_url, driver_license_doc_url, 
     terms_accepted, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [
      userId,
      full_name,
      email,
      phone,
      document_type,
      document_number,
      service_type,
      city,
      coverage_areas,
      experience_years,
      vehicle_type,
      vehicle_plate,
      bio_description,
      hourly_rate,
      document_id_front_url,
      document_id_back_url,
      criminal_record_doc_url,
      driver_license_doc_url,
      terms_accepted ? 1 : 0
    ]
  );

  return {
    id: result.insertId,
    full_name,
    email,
    phone,
    document_type,
    document_number,
    service_type,
    city,
    coverage_areas,
    status: 'pending',
    message: 'Postulación recibida exitosamente. Nuestro equipo revisará tus antecedentes y documentos.'
  };
};

/**
 * Get provider status by user ID or email
 */
export const getProviderStatus = async (email, userId = null) => {
  let query = 'SELECT id, user_id, full_name, email, phone, service_type, city, status, created_at FROM service_providers WHERE ';
  const params = [];

  if (userId) {
    query += 'user_id = ? OR email = ? ORDER BY id DESC LIMIT 1';
    params.push(userId, email);
  } else {
    query += 'email = ? ORDER BY id DESC LIMIT 1';
    params.push(email);
  }

  const [rows] = await pool.query(query, params);
  return rows.length > 0 ? rows[0] : null;
};

/**
 * List verified/approved service providers
 */
export const listApprovedProviders = async ({ service_type, city } = {}) => {
  let query = "SELECT id, full_name, email, phone, service_type, city, coverage_areas, experience_years, vehicle_type, bio_description, hourly_rate, created_at FROM service_providers WHERE status = 'approved'";
  const params = [];

  if (service_type) {
    query += ' AND (service_type = ? OR service_type = "both")';
    params.push(service_type);
  }

  if (city) {
    query += ' AND city LIKE ?';
    params.push(`%${city}%`);
  }

  query += ' ORDER BY created_at DESC';

  const [rows] = await pool.query(query, params);
  return rows;
};

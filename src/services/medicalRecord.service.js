import pool from '../config/db.js';

/**
 * Calcula el siguiente número consecutivo para una clínica
 */
export const getNextConsecutive = async (clinicId) => {
  const [rows] = await pool.query(
    'SELECT COALESCE(MAX(consecutive_number), 0) + 1 as next_number FROM medical_records WHERE clinic_id = ?',
    [clinicId]
  );
  const nextNum = rows[0].next_number;
  const nextCode = 'HC-' + String(nextNum).padStart(4, '0');
  return { next_number: nextNum, next_code: nextCode };
};

/**
 * Registra una nueva Historia Clínica asignando consecutivo exclusivo para la veterinaria
 */
export const createMedicalRecord = async (data) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const {
      clinic_id,
      pet_id,
      vet_id,
      record_type = 'consultation',
      reason,
      anamnesis = null,
      weight_kg = null,
      temperature = null,
      heart_rate = null,
      respiratory_rate = null,
      mucosa_state = null,
      body_condition = null,
      diagnosis,
      treatment,
      prescription = null,
      next_control_date = null
    } = data;

    // 1. Obtener owner_id de la mascota
    const [petRows] = await connection.query(
      'SELECT id, owner_id, name FROM pets WHERE id = ?',
      [pet_id]
    );
    if (petRows.length === 0) {
      throw new Error('PET_NOT_FOUND');
    }
    const owner_id = petRows[0].owner_id;

    // 2. Calcular consecutivo atómicamente con bloqueo de fila
    const [consecRows] = await connection.query(
      'SELECT COALESCE(MAX(consecutive_number), 0) + 1 as next_number FROM medical_records WHERE clinic_id = ? FOR UPDATE',
      [clinic_id]
    );
    const consecutive_number = consecRows[0].next_number;
    const consecutive_code = 'HC-' + String(consecutive_number).padStart(4, '0');

    // 3. Insertar historia clínica
    const [insertResult] = await connection.query(
      `INSERT INTO medical_records 
       (clinic_id, pet_id, owner_id, vet_id, consecutive_number, consecutive_code, record_type,
        reason, anamnesis, weight_kg, temperature, heart_rate, respiratory_rate,
        mucosa_state, body_condition, diagnosis, treatment, prescription, next_control_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        clinic_id,
        pet_id,
        owner_id,
        vet_id,
        consecutive_number,
        consecutive_code,
        record_type,
        reason,
        anamnesis,
        weight_kg,
        temperature,
        heart_rate,
        respiratory_rate,
        mucosa_state,
        body_condition,
        diagnosis,
        treatment,
        prescription,
        next_control_date
      ]
    );

    const record_id = insertResult.insertId;

    // 4. Asegurar que la mascota esté vinculada a la clínica
    await connection.query(
      `INSERT INTO clinic_patients (clinic_id, pet_id, owner_id, notes, status, linked_at)
       VALUES (?, ?, ?, 'Atendido en consulta médica', 'active', CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE status = 'active'`,
      [clinic_id, pet_id, owner_id]
    );

    await connection.commit();

    // 5. Consultar los datos completos del registro recién creado
    const [createdRecord] = await pool.query(
      `SELECT mr.*, 
              p.name as pet_name, p.type as pet_type, p.age as pet_age,
              b.name as breed_name,
              po.full_name as owner_name, po.document_number as owner_document, po.phone as owner_phone, po.email as owner_email,
              v.full_name as vet_name, v.professional_card as vet_card, v.specialty as vet_specialty,
              c.name as clinic_name, c.phone as clinic_phone, c.city as clinic_city
       FROM medical_records mr
       INNER JOIN pets p ON mr.pet_id = p.id
       LEFT JOIN breeds b ON p.breed_id = b.id
       INNER JOIN pet_owners po ON mr.owner_id = po.id
       INNER JOIN veterinarians v ON mr.vet_id = v.id
       INNER JOIN clinics c ON mr.clinic_id = c.id
       WHERE mr.id = ?`,
      [record_id]
    );

    return createdRecord[0];
  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

/**
 * Consulta el historial médico completo de una mascota ordenado cronológicamente
 */
export const getPetMedicalHistory = async (petId) => {
  const [records] = await pool.query(
    `SELECT mr.*, 
            p.name as pet_name, p.type as pet_type,
            b.name as breed_name,
            po.full_name as owner_name, po.document_number as owner_document,
            v.full_name as vet_name, v.professional_card as vet_card, v.specialty as vet_specialty,
            c.name as clinic_name, c.phone as clinic_phone, c.city as clinic_city
     FROM medical_records mr
     INNER JOIN pets p ON mr.pet_id = p.id
     LEFT JOIN breeds b ON p.breed_id = b.id
     INNER JOIN pet_owners po ON mr.owner_id = po.id
     INNER JOIN veterinarians v ON mr.vet_id = v.id
     INNER JOIN clinics c ON mr.clinic_id = c.id
     WHERE mr.pet_id = ?
     ORDER BY mr.created_at DESC`,
    [petId]
  );
  return records;
};

/**
 * Consulta todas las historias clínicas emitidas por una veterinaria específica
 */
export const getClinicMedicalRecords = async (clinicId, search = '') => {
  let query = `
    SELECT mr.*, 
           p.name as pet_name, p.type as pet_type,
           b.name as breed_name,
           po.full_name as owner_name, po.document_number as owner_document, po.phone as owner_phone,
           v.full_name as vet_name, v.professional_card as vet_card
    FROM medical_records mr
    INNER JOIN pets p ON mr.pet_id = p.id
    LEFT JOIN breeds b ON p.breed_id = b.id
    INNER JOIN pet_owners po ON mr.owner_id = po.id
    INNER JOIN veterinarians v ON mr.vet_id = v.id
    WHERE mr.clinic_id = ?
  `;
  const params = [clinicId];

  if (search && search.trim() !== '') {
    const pattern = '%' + search.trim() + '%';
    query += ' AND (mr.consecutive_code LIKE ? OR p.name LIKE ? OR po.full_name LIKE ? OR mr.diagnosis LIKE ? OR v.full_name LIKE ?) ';
    params.push(pattern, pattern, pattern, pattern, pattern);
  }

  query += ' ORDER BY mr.consecutive_number DESC';

  const [records] = await pool.query(query, params);
  return records;
};

/**
 * Consulta el detalle de una historia clínica por su ID
 */
export const getMedicalRecordById = async (id) => {
  const [records] = await pool.query(
    `SELECT mr.*, 
            p.name as pet_name, p.type as pet_type, p.age as pet_age, p.fur_color as pet_color,
            b.name as breed_name,
            po.full_name as owner_name, po.document_number as owner_document, po.phone as owner_phone, po.email as owner_email, po.city as owner_city,
            v.full_name as vet_name, v.professional_card as vet_card, v.specialty as vet_specialty,
            c.name as clinic_name, c.phone as clinic_phone, c.city as clinic_city
     FROM medical_records mr
     INNER JOIN pets p ON mr.pet_id = p.id
     LEFT JOIN breeds b ON p.breed_id = b.id
     INNER JOIN pet_owners po ON mr.owner_id = po.id
     INNER JOIN veterinarians v ON mr.vet_id = v.id
     INNER JOIN clinics c ON mr.clinic_id = c.id
     WHERE mr.id = ?`,
    [id]
  );
  return records[0] || null;
};

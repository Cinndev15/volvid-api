import pool from '../config/db.js';

export const createAppointment = async (data) => {
  const {
    clinic_id,
    pet_id,
    vet_id = null,
    appointment_date,
    appointment_time,
    duration_minutes = 30,
    motive,
    notes = null,
    status = 'scheduled'
  } = data;

  // 1. Obtener owner_id de la mascota
  const [pets] = await pool.query('SELECT id, owner_id FROM pets WHERE id = ?', [pet_id]);
  if (pets.length === 0) {
    throw new Error('PET_NOT_FOUND');
  }
  const owner_id = pets[0].owner_id;

  // 2. Insertar cita médica
  const [result] = await pool.query(
    `INSERT INTO appointments 
     (clinic_id, pet_id, owner_id, vet_id, appointment_date, appointment_time, duration_minutes, motive, notes, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      clinic_id,
      pet_id,
      owner_id,
      vet_id || null,
      appointment_date,
      appointment_time,
      duration_minutes,
      motive,
      notes,
      status
    ]
  );

  const appointmentId = result.insertId;

  // 3. Asegurar vinculación en clinic_patients
  await pool.query(
    `INSERT INTO clinic_patients (clinic_id, pet_id, owner_id, notes, status, linked_at)
     VALUES (?, ?, ?, 'Cita programada', 'active', CURRENT_TIMESTAMP)
     ON DUPLICATE KEY UPDATE status = 'active'`,
    [clinic_id, pet_id, owner_id]
  );

  // 4. Retornar cita con todos los datos relacionados
  const [created] = await pool.query(
    `SELECT a.*,
            p.name as pet_name, p.type as pet_type, p.age as pet_age,
            b.name as breed_name,
            po.full_name as owner_name, po.document_number as owner_document, po.phone as owner_phone, po.email as owner_email,
            v.full_name as vet_name, v.professional_card as vet_card, v.specialty as vet_specialty
     FROM appointments a
     INNER JOIN pets p ON a.pet_id = p.id
     LEFT JOIN breeds b ON p.breed_id = b.id
     INNER JOIN pet_owners po ON a.owner_id = po.id
     LEFT JOIN veterinarians v ON a.vet_id = v.id
     WHERE a.id = ?`,
    [appointmentId]
  );

  return created[0];
};

export const getClinicAppointments = async (clinicId, filters = {}) => {
  let query = `
    SELECT a.*,
           p.name as pet_name, p.type as pet_type, p.age as pet_age, p.photo_url,
           b.name as breed_name,
           po.full_name as owner_name, po.document_number as owner_document, po.phone as owner_phone, po.email as owner_email,
           v.full_name as vet_name, v.professional_card as vet_card, v.specialty as vet_specialty
    FROM appointments a
    INNER JOIN pets p ON a.pet_id = p.id
    LEFT JOIN breeds b ON p.breed_id = b.id
    INNER JOIN pet_owners po ON a.owner_id = po.id
    LEFT JOIN veterinarians v ON a.vet_id = v.id
    WHERE a.clinic_id = ?
  `;
  const params = [clinicId];

  if (filters.date) {
    query += ' AND a.appointment_date = ?';
    params.push(filters.date);
  } else if (filters.month && filters.year) {
    query += ' AND MONTH(a.appointment_date) = ? AND YEAR(a.appointment_date) = ?';
    params.push(parseInt(filters.month, 10), parseInt(filters.year, 10));
  }

  if (filters.status) {
    query += ' AND a.status = ?';
    params.push(filters.status);
  }

  if (filters.search && filters.search.trim() !== '') {
    const pattern = '%' + filters.search.trim() + '%';
    query += ' AND (p.name LIKE ? OR po.full_name LIKE ? OR a.motive LIKE ? OR v.full_name LIKE ?)';
    params.push(pattern, pattern, pattern, pattern);
  }

  query += ' ORDER BY a.appointment_date ASC, a.appointment_time ASC';

  const [appointments] = await pool.query(query, params);
  return appointments;
};

export const updateAppointmentStatus = async (id, clinicId, status) => {
  await pool.query(
    'UPDATE appointments SET status = ? WHERE id = ? AND clinic_id = ?',
    [status, id, clinicId]
  );
  return { success: true, message: `Estado de cita actualizado a ${status}` };
};

export const deleteAppointment = async (id, clinicId) => {
  await pool.query(
    'DELETE FROM appointments WHERE id = ? AND clinic_id = ?',
    [id, clinicId]
  );
  return { success: true, message: 'Cita eliminada correctamente.' };
};

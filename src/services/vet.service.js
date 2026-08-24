import pool from '../config/db.js';

export const getClinicVets = async (clinicId) => {
  const [vets] = await pool.query(
    `SELECT id, clinic_id, full_name, document_number, professional_card, specialty, phone, email, status, created_at
     FROM veterinarians
     WHERE clinic_id = ? AND status = 'active'
     ORDER BY full_name ASC`,
    [clinicId]
  );
  return vets;
};

export const createVet = async (clinicId, vetData) => {
  const [result] = await pool.query(
    `INSERT INTO veterinarians (clinic_id, full_name, document_number, professional_card, specialty, phone, email, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
    [
      clinicId,
      vetData.full_name,
      vetData.document_number || null,
      vetData.professional_card,
      vetData.specialty || 'Medicina General',
      vetData.phone || null,
      vetData.email || null
    ]
  );

  const [created] = await pool.query('SELECT * FROM veterinarians WHERE id = ?', [result.insertId]);
  return created[0];
};

export const updateVet = async (vetId, clinicId, vetData) => {
  await pool.query(
    `UPDATE veterinarians 
     SET full_name = COALESCE(?, full_name),
         document_number = COALESCE(?, document_number),
         professional_card = COALESCE(?, professional_card),
         specialty = COALESCE(?, specialty),
         phone = COALESCE(?, phone),
         email = COALESCE(?, email),
         status = COALESCE(?, status)
     WHERE id = ? AND clinic_id = ?`,
    [
      vetData.full_name,
      vetData.document_number,
      vetData.professional_card,
      vetData.specialty,
      vetData.phone,
      vetData.email,
      vetData.status,
      vetId,
      clinicId
    ]
  );

  const [updated] = await pool.query('SELECT * FROM veterinarians WHERE id = ?', [vetId]);
  return updated[0];
};

export const deleteVet = async (vetId, clinicId) => {
  await pool.query(
    "UPDATE veterinarians SET status = 'inactive' WHERE id = ? AND clinic_id = ?",
    [vetId, clinicId]
  );
  return { success: true, message: 'Veterinario desactivado correctamente.' };
};

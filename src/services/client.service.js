import pool from '../config/db.js';

/**
 * Busca propietarios y sus mascotas por coincidencia de cédula, teléfono, email o código/nombre.
 * Indica si cada mascota ya está vinculada a la clínica especificada.
 */
export const searchOwnerAndPets = async (query, clinicId) => {
  if (!query || query.trim() === '') {
    return [];
  }

  const cleanQuery = query.trim();
  const searchPattern = '%' + cleanQuery + '%';

  // 1. Buscar propietarios que coincidan por documento, teléfono, email o nombre
  const [owners] = await pool.query(
    `SELECT id, full_name, document_number, email, phone, address, city, avatar_url, created_at
     FROM pet_owners
     WHERE document_number = ? 
        OR phone = ? 
        OR email = ? 
        OR document_number LIKE ? 
        OR phone LIKE ? 
        OR email LIKE ? 
        OR full_name LIKE ?
     LIMIT 10`,
    [cleanQuery, cleanQuery, cleanQuery, searchPattern, searchPattern, searchPattern, searchPattern]
  );

  // 2. Si no se encontraron dueños directamente, buscar por nombre de mascota
  let ownerIds = owners.map(o => o.id);
  
  if (ownerIds.length === 0) {
    const [petOwnersByPet] = await pool.query(
      `SELECT DISTINCT po.id, po.full_name, po.document_number, po.email, po.phone, po.address, po.city, po.avatar_url, po.created_at
       FROM pets p
       INNER JOIN pet_owners po ON p.owner_id = po.id
       WHERE p.name LIKE ? OR p.observations LIKE ?
       LIMIT 10`,
      [searchPattern, searchPattern]
    );

    if (petOwnersByPet.length > 0) {
      owners.push(...petOwnersByPet);
      ownerIds = owners.map(o => o.id);
    }
  }

  if (owners.length === 0) {
    return [];
  }

  // 3. Para cada dueño, consultar sus mascotas y verificar si están vinculadas a clinicId
  const results = [];

  for (const owner of owners) {
    const [pets] = await pool.query(
      `SELECT p.id, p.owner_id, p.breed_id, p.name, p.type, p.photo_url, 
              p.age, p.fur_color, p.temperament, p.status, p.observations, p.qr_code,
              b.name as breed_name,
              cp.id as link_id,
              cp.status as link_status,
              cp.linked_at,
              cp.notes as link_notes,
              CASE WHEN cp.id IS NOT NULL AND cp.status = 'active' THEN 1 ELSE 0 END as is_linked
       FROM pets p
       LEFT JOIN breeds b ON p.breed_id = b.id
       LEFT JOIN clinic_patients cp ON cp.pet_id = p.id AND cp.clinic_id = ?
       WHERE p.owner_id = ?
       ORDER BY p.name ASC`,
      [clinicId || 0, owner.id]
    );

    results.push({
      ...owner,
      pets: pets.map(p => ({
        ...p,
        is_linked: Boolean(p.is_linked)
      }))
    });
  }

  return results;
};

/**
 * Vincula una mascota a la veterinaria indicada.
 */
export const linkPetToClinic = async (clinicId, petId, notes = null) => {
  // 1. Obtener información de la mascota y su dueño
  const [pets] = await pool.query(
    'SELECT id, owner_id, name FROM pets WHERE id = ?',
    [petId]
  );

  if (pets.length === 0) {
    throw new Error('PET_NOT_FOUND');
  }

  const pet = pets[0];

  // 2. Insertar o actualizar el vínculo
  await pool.query(
    `INSERT INTO clinic_patients (clinic_id, pet_id, owner_id, notes, status, linked_at)
     VALUES (?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)
     ON DUPLICATE KEY UPDATE status = 'active', notes = COALESCE(?, notes), updated_at = CURRENT_TIMESTAMP`,
    [clinicId, petId, pet.owner_id, notes, notes]
  );

  // 3. Devolver los detalles completos del paciente vinculado
  const [linkedData] = await pool.query(
    `SELECT cp.id as link_id, cp.clinic_id, cp.status as link_status, cp.linked_at, cp.notes,
            p.id as pet_id, p.name as pet_name, p.type, p.age, p.fur_color, p.photo_url,
            b.name as breed_name,
            po.id as owner_id, po.full_name as owner_name, po.document_number, po.phone, po.email, po.city
     FROM clinic_patients cp
     INNER JOIN pets p ON cp.pet_id = p.id
     LEFT JOIN breeds b ON p.breed_id = b.id
     INNER JOIN pet_owners po ON cp.owner_id = po.id
     WHERE cp.clinic_id = ? AND cp.pet_id = ?`,
    [clinicId, petId]
  );

  return linkedData[0];
};

/**
 * Obtiene la lista exclusiva de pacientes vinculados a una veterinaria específica.
 */
export const getClinicPatients = async (clinicId, search = '') => {
  let query = `
    SELECT cp.id as link_id, cp.clinic_id, cp.status as link_status, cp.linked_at, cp.notes as link_notes,
           p.id as pet_id, p.name as pet_name, p.type as pet_type, p.age, p.fur_color, p.photo_url, p.temperament, p.observations,
           b.name as breed_name,
           po.id as owner_id, po.full_name as owner_name, po.document_number, po.phone as owner_phone, po.email as owner_email, po.city as owner_city
    FROM clinic_patients cp
    INNER JOIN pets p ON cp.pet_id = p.id
    LEFT JOIN breeds b ON p.breed_id = b.id
    INNER JOIN pet_owners po ON cp.owner_id = po.id
    WHERE cp.clinic_id = ? AND cp.status = 'active'
  `;

  const params = [clinicId];

  if (search && search.trim() !== '') {
    const pattern = '%' + search.trim() + '%';
    query += ' AND (p.name LIKE ? OR po.full_name LIKE ? OR po.document_number LIKE ? OR po.phone LIKE ? OR b.name LIKE ?) ';
    params.push(pattern, pattern, pattern, pattern, pattern);
  }

  query += ' ORDER BY cp.linked_at DESC, p.name ASC';

  const [patients] = await pool.query(query, params);
  return patients;
};

/**
 * Registra un nuevo propietario y su mascota en el catálogo global de Volvid y lo vincula a la veterinaria.
 */
export const registerAndLinkClient = async (clinicId, ownerData, petData) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Verificar si ya existe por email o documento
    let ownerId;
    const [existing] = await connection.query(
      'SELECT id FROM pet_owners WHERE (email = ? AND email != "") OR (document_number = ? AND document_number != "") LIMIT 1',
      [ownerData.email || '', ownerData.document_number || '']
    );

    if (existing.length > 0) {
      ownerId = existing[0].id;
      await connection.query(
        'UPDATE pet_owners SET full_name = COALESCE(?, full_name), phone = COALESCE(?, phone), address = COALESCE(?, address), city = COALESCE(?, city) WHERE id = ?',
        [ownerData.full_name, ownerData.phone, ownerData.address, ownerData.city, ownerId]
      );
    } else {
      const [insertOwner] = await connection.query(
        `INSERT INTO pet_owners (full_name, document_number, email, phone, address, city, terms_accepted)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [
          ownerData.full_name,
          ownerData.document_number || null,
          ownerData.email || null,
          ownerData.phone || null,
          ownerData.address || null,
          ownerData.city || null
        ]
      );
      ownerId = insertOwner.insertId;
    }

    // 2. Obtener o asignar breed_id
    let breedId = petData.breed_id;
    if (!breedId && petData.breed_name) {
      const [breedRow] = await connection.query(
        'SELECT id FROM breeds WHERE name = ? LIMIT 1',
        [petData.breed_name]
      );
      breedId = breedRow.length > 0 ? breedRow[0].id : (petData.type === 'cat' ? 23 : 1);
    }
    if (!breedId) {
      breedId = petData.type === 'cat' ? 23 : 1;
    }

    // 3. Crear mascota
    const [insertPet] = await connection.query(
      `INSERT INTO pets (owner_id, breed_id, name, type, photo_url, age, fur_color, temperament, status, observations)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
      [
        ownerId,
        breedId,
        petData.name,
        petData.type || 'dog',
        petData.photo_url || null,
        petData.age || null,
        petData.fur_color || null,
        petData.temperament || null,
        petData.observations || null
      ]
    );

    const petId = insertPet.insertId;

    // 4. Vincular a la clínica
    await connection.query(
      `INSERT INTO clinic_patients (clinic_id, pet_id, owner_id, notes, status, linked_at)
       VALUES (?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE status = 'active'`,
      [clinicId, petId, ownerId, petData.notes || 'Registrado directamente en la clínica']
    );

    await connection.commit();

    return {
      owner_id: ownerId,
      pet_id: petId,
      owner_name: ownerData.full_name,
      pet_name: petData.name,
      clinic_id: clinicId,
      status: 'active'
    };
  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

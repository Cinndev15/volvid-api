import pool from '../config/db.js';

/**
 * Register a new pet associated with an owner
 * 
 * @param {object} petData Pet parameters (name, type, breed_id, photo_url, etc.)
 * @param {number} ownerId Owner ID from JWT
 * @returns {Promise<object>} Created pet details
 */
export const createPet = async (petData, ownerId) => {
  const { name, type, breed_id, photo_url, age, fur_color, temperament, status, observations } = petData;

  // 1. Verify breed exists and matches type
  const [breeds] = await pool.query(
    'SELECT id FROM breeds WHERE id = ? AND type = ?',
    [breed_id, type]
  );

  if (breeds.length === 0) {
    throw new Error('INVALID_BREED');
  }

  // 2. Insert pet into database
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

  // 3. Fetch and return complete pet details
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

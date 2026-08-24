import pool from '../config/db.js';

/**
 * Retrieves all breeds filtered by type (dog or cat)
 * 
 * @param {string} type 'dog' or 'cat'
 * @returns {Promise<Array>} List of breeds
 */
export const getBreedsByType = async (type) => {
  const [breeds] = await pool.query(
    'SELECT id, type, name FROM breeds WHERE type = ? ORDER BY name ASC',
    [type]
  );
  return breeds;
};

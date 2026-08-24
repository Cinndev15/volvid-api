import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import config from '../config/config.js';

/**
 * Register a new pet owner (traditional or via Google)
 * 
 * @param {object} ownerData Form fields (full_name, email, terms_accepted, etc.)
 * @param {string} [ownerData.password] Plaintext password (required if no google_id)
 * @param {string} [ownerData.google_id] Google OAuth Subject ID (optional)
 * @param {string} [ownerData.avatar_url] Google Profile Picture URL (optional)
 */
export const registerOrLoginOwner = async (ownerData) => {
  const { full_name, email, password, google_id, avatar_url, terms_accepted } = ownerData;

  // 1. If it's a Google registration/login
  if (google_id) {
    // Check if the owner already exists in pet_owners
    const [existingOwners] = await pool.query(
      'SELECT * FROM pet_owners WHERE email = ?',
      [email]
    );

    if (existingOwners.length > 0) {
      const owner = existingOwners[0];

      // Case A: Owner exists and already has this google_id or doesn't have any google_id yet
      if (!owner.google_id) {
        // Link Google ID and update avatar to existing email/password account
        await pool.query(
          'UPDATE pet_owners SET google_id = ?, avatar_url = ? WHERE id = ?',
          [google_id, avatar_url || owner.avatar_url, owner.id]
        );
        owner.google_id = google_id;
        if (avatar_url) owner.avatar_url = avatar_url;
      } else if (owner.google_id !== google_id) {
        // Safe check if google_id differs (very rare unless email is reused)
        throw new Error('EMAIL_EXISTS_WITH_OTHER_METHOD');
      }

      // Generate session token (acts as login)
      const token = generateOwnerToken(owner.id, owner.email);
      return {
        token,
        owner: {
          id: owner.id,
          full_name: owner.full_name,
          email: owner.email,
          avatar_url: owner.avatar_url,
          google_id: owner.google_id
        }
      };
    }

    // Case B: Google owner does not exist, create a new record
    // Ensure google_id is not already registered under another email
    const [ownersByGoogleId] = await pool.query(
      'SELECT id FROM pet_owners WHERE google_id = ?',
      [google_id]
    );
    if (ownersByGoogleId.length > 0) {
      throw new Error('GOOGLE_ID_ALREADY_REGISTERED');
    }

    // Insert new owner
    const [insertResult] = await pool.query(
      `INSERT INTO pet_owners (full_name, email, password_hash, google_id, avatar_url, terms_accepted) 
       VALUES (?, ?, NULL, ?, ?, ?)`,
      [full_name, email, google_id, avatar_url || null, terms_accepted ? 1 : 0]
    );

    const newOwnerId = insertResult.insertId;
    const token = generateOwnerToken(newOwnerId, email);

    return {
      token,
      owner: {
        id: newOwnerId,
        full_name,
        email,
        avatar_url: avatar_url || null,
        google_id
      }
    };
  }

  // 2. Traditional Email/Password registration
  // Check if email already registered in pet_owners
  const [existingOwners] = await pool.query(
    'SELECT id FROM pet_owners WHERE email = ?',
    [email]
  );
  if (existingOwners.length > 0) {
    throw new Error('EMAIL_EXISTS');
  }

  // Check if email registered in users (veterinarians/admins)
  const [existingUsers] = await pool.query(
    'SELECT id FROM users WHERE email = ?',
    [email]
  );
  if (existingUsers.length > 0) {
    throw new Error('EMAIL_EXISTS');
  }

  // Hash password
  const saltRounds = 10;
  const password_hash = await bcrypt.hash(password, saltRounds);

  // Insert into database
  const [insertResult] = await pool.query(
    `INSERT INTO pet_owners (full_name, email, password_hash, google_id, avatar_url, terms_accepted) 
     VALUES (?, ?, ?, NULL, NULL, ?)`,
    [full_name, email, password_hash, terms_accepted ? 1 : 0]
  );

  const newOwnerId = insertResult.insertId;
  const token = generateOwnerToken(newOwnerId, email);

  return {
    token,
    owner: {
      id: newOwnerId,
      full_name,
      email,
      avatar_url: null,
      google_id: null
    }
  };
};

/**
 * Generate a JWT token for a pet owner
 */
const generateOwnerToken = (ownerId, email) => {
  return jwt.sign(
    {
      ownerId: ownerId,
      email: email,
      role: 'owner'
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.expiresIn
    }
  );
};

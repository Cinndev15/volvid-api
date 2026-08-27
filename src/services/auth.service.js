import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import config from '../config/config.js';
import { sendPasswordResetEmail } from './email.service.js';

export const registerClinicAndAdmin = async (clinicData, userData) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // 1. Check if user email already exists
    const [existingUsers] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      [userData.email]
    );

    if (existingUsers.length > 0) {
      throw new Error('EMAIL_EXISTS');
    }

    // 2. Start transaction
    await connection.beginTransaction();

    // 3. Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(userData.password, saltRounds);

    // 4. Insert clinic calculating 14-day trial end date
    const [clinicResult] = await connection.query(
      `INSERT INTO clinics 
       (name, phone, size, country, state, city, status, trial_start, trial_end) 
       VALUES (?, ?, ?, ?, ?, ?, 'trial', CURRENT_TIMESTAMP, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 14 DAY))`,
      [
        clinicData.name,
        clinicData.phone,
        clinicData.size,
        clinicData.country,
        clinicData.state,
        clinicData.city
      ]
    );

    const clinic_id = clinicResult.insertId;

    // 5. Insert user linked to the clinic
    const [userResult] = await connection.query(
      `INSERT INTO users 
       (clinic_id, full_name, email, password_hash, terms_accepted, role) 
       VALUES (?, ?, ?, ?, ?, 'admin')`,
      [
        clinic_id,
        userData.full_name,
        userData.email,
        password_hash,
        userData.terms_accepted ? 1 : 0
      ]
    );

    const user_id = userResult.insertId;

    // 6. Commit transaction
    await connection.commit();

    // Fetch the created clinic to return complete trial dates
    const [clinics] = await connection.query(
      'SELECT id, name, status, trial_start, trial_end FROM clinics WHERE id = ?',
      [clinic_id]
    );

    return {
      clinic: clinics[0],
      user: {
        id: user_id,
        full_name: userData.full_name,
        email: userData.email,
        role: 'admin'
      }
    };

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

export const authenticateUser = async (email, password) => {
  const [users] = await pool.query(
    `SELECT u.*, c.name as clinic_name, c.phone as clinic_phone, c.size as clinic_size, c.country as clinic_country, c.state as clinic_state, c.city as clinic_city, c.status as clinic_status, c.trial_end as clinic_trial_end 
     FROM users u 
     INNER JOIN clinics c ON u.clinic_id = c.id 
     WHERE u.email = ?`,
    [email]
  );

  if (users.length === 0) {
    // Check in pet_owners table for pet owner conventional login
    const [owners] = await pool.query(
      'SELECT * FROM pet_owners WHERE email = ?',
      [email]
    );

    if (owners.length === 0) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const owner = owners[0];

    if (!owner.password_hash) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const isMatch = await bcrypt.compare(password, owner.password_hash);
    if (!isMatch) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const token = jwt.sign(
      {
        ownerId: owner.id,
        email: owner.email,
        role: 'owner'
      },
      config.jwt.secret,
      {
        expiresIn: config.jwt.expiresIn
      }
    );

    return {
      token,
      isOwner: true,
      owner: {
        id: owner.id,
        full_name: owner.full_name,
        email: owner.email,
        avatar_url: owner.avatar_url,
        google_id: owner.google_id
      }
    };
  }

  const user = users[0];

  // Verify password
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new Error('INVALID_CREDENTIALS');
  }

  // Check if trial has expired
  let isTrialExpired = false;
  if (user.clinic_status === 'trial' && user.clinic_trial_end) {
    const trialEnd = new Date(user.clinic_trial_end);
    const now = new Date();
    if (now > trialEnd) {
      isTrialExpired = true;
    }
  }

  // Generate JWT token
  const token = jwt.sign(
    {
      userId: user.id,
      clinicId: user.clinic_id,
      role: user.role
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.expiresIn
    }
  );

  // Return user info and token
  return {
    token,
    user: {
      id: user.id,
      clinic_id: user.clinic_id,
      full_name: user.full_name,
      email: user.email,
      role: user.role
    },
    clinic: {
      id: user.clinic_id,
      name: user.clinic_name,
      phone: user.clinic_phone,
      size: user.clinic_size,
      country: user.clinic_country,
      state: user.clinic_state,
      city: user.clinic_city,
      status: user.clinic_status,
      trial_end: user.clinic_trial_end,
      is_trial_expired: isTrialExpired
    }
  };
};

/**
 * Handles password reset requests by checking user existence and sending recovery instructions.
 * 
 * @param {string} email User email address
 */
export const requestPasswordReset = async (email) => {
  let targetUser = null;
  let userType = 'user';

  // 1. Check in users table (Veterinaries / Clinic staff)
  const [users] = await pool.query(
    'SELECT id, full_name, email, role FROM users WHERE email = ?',
    [email]
  );

  if (users.length > 0) {
    targetUser = users[0];
    userType = 'user';
  } else {
    // 2. Check in pet_owners table
    const [owners] = await pool.query(
      'SELECT id, full_name, email FROM pet_owners WHERE email = ?',
      [email]
    );

    if (owners.length > 0) {
      targetUser = owners[0];
      userType = 'owner';
    } else {
      // 3. Check in volvid_admins table
      try {
        const [admins] = await pool.query(
          'SELECT id, full_name, email, role FROM volvid_admins WHERE email = ?',
          [email]
        );
        if (admins.length > 0) {
          targetUser = admins[0];
          userType = 'admin';
        }
      } catch (err) {
        // In case volvid_admins table is not present
      }
    }
  }

  // If user exists, generate reset token and send email
  if (targetUser) {
    const resetToken = jwt.sign(
      {
        userId: targetUser.id,
        email: targetUser.email,
        type: 'password_reset',
        userType
      },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    const resetLink = `https://app.volvidmascotas.com/reset-password?token=${resetToken}&email=${encodeURIComponent(targetUser.email)}`;

    sendPasswordResetEmail(
      targetUser.email,
      targetUser.full_name || 'Usuario',
      resetLink
    ).catch((err) => {
      console.error('❌ Error sending password reset email asynchronously:', err.message);
    });
  } else {
    console.log(`ℹ️ Password reset requested for non-existent email: ${email}`);
  }

  return {
    success: true,
    message: 'Hemos enviado las instrucciones de recuperación a tu correo electrónico.'
  };
};


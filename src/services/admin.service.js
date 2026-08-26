import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
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

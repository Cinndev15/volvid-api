import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

const config = {
  port: process.env.PORT || 3001,
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'volvid_db'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret_key_volvid_2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  email: {
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 465,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'Volvid Mascotas <info@volvidmascotas.com>'
  }
};

export default config;

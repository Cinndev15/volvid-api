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
  }
};

export default config;

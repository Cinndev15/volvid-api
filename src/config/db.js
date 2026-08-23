import mysql from 'mysql2/promise';
import config from './config.js';

const pool = mysql.createPool({
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  database: config.db.name,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Verify the connection pool is functioning
pool.getConnection()
  .then((connection) => {
    console.log('Successfully connected to the MySQL connection pool.');
    connection.release();
  })
  .catch((error) => {
    console.error('Critical Error: Could not connect to the database. Reason:', error.message);
  });

export default pool;

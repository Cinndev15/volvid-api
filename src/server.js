import app from './app.js';
import config from './config/config.js';
import pool from './config/db.js'; // Ensure database connection pool is checked

const server = app.listen(config.port, () => {
  console.log(`[Volvid API] Server running in development mode on port ${config.port}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    pool.end(() => {
      console.log('MySQL connection pool closed');
      process.exit(0);
    });
  });
});

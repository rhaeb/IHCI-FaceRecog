// src/db.js
const { Pool } = require('pg');
require('dotenv').config(); // Load environment variables from .env

// Use DATABASE_URL if it's available, else fallback to individual environment variables
const pool = new Pool(
    process.env.DATABASE_URL
        ? {
              connectionString: process.env.DATABASE_URL, // Use connection string for remote DB
              ssl: { rejectUnauthorized: false }, // Optional: Use if remote DB requires SSL
          }
        : {
              user: process.env.DB_USER,
              host: process.env.DB_HOST,
              database: process.env.DB_NAME,
              password: process.env.DB_PASS,
              port: process.env.DB_PORT,
          }
);

module.exports = pool;

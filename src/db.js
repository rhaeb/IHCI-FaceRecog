// const { Client } = require('pg');
// const dotenv = require('dotenv');

// dotenv.config();

// const client = new Client({
//   host: process.env.DB_HOST,
//   port: process.env.DB_PORT,
//   database: process.env.DB_NAME,
//   user: process.env.DB_USER,
//   password: "123456",
// });

// // client.connect()
// //   .then(() => console.log("Connected to PostgreSQL"))
// //   .catch(err => console.error("Connection error", err.stack));

// client.connect()
//     .then(() => {
//         console.log('Connected to PostgreSQL');
//         // Perform a simple query to test the connection
//         return client.query('SELECT * FROM USERS');
//     })
//     .then((res) => {
//         console.log('PostgreSQL connection test result:', res.rows[0]);
//     })
//     .catch((err) => {
//         console.error('Error connecting to PostgreSQL:', err);
//     });

// module.exports = client;
const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: "123456",//process.env.DB_PASS, // Use env variable instead of hardcoded password
  ssl: false, //{ rejectUnauthorized: false }, // Ensure secure connection for cloud databases
});

client.connect()
  .then(() => {
    console.log('Connected to PostgreSQL');
    return client.query('SELECT 1'); // Simple test query instead of selecting all users
  })
  .then(() => {
    console.log('PostgreSQL connection verified.');
  })
  .catch((err) => {
    console.error('Error connecting to PostgreSQL:', err.message);
    process.exit(1); // Exit to prevent hanging builds
  });

module.exports = client;

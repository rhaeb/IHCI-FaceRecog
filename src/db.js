const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: "000000",
});

client.connect()
    .then(() => {
        console.log('Connected to PostgreSQL');
        // Perform a simple query to test the connection
        return client.query('SELECT *');
    })
    .then((res) => {
        console.log('PostgreSQL connection test result:', res.rows[0]);
    })
    .catch((err) => {
        console.error('Error connecting to PostgreSQL:', err);
    });

module.exports = client;
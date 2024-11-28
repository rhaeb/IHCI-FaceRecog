const pool = require('../db'); // Assuming db.js is at src level

const createUser = async (userData) => {
    const { fname, lname, email, hashedPassword, faceData } = userData;
    const result = await client.query(
        'INSERT INTO USERS (U_FNAME, U_LNAME, U_EMAIL, U_PASSW, U_FACE_DATA) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [firstName, lastName, email, password, faceData]
      );
      return result.rows[0];
};
module.exports = { createUser };
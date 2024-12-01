const db = require('../db');
const bcrypt = require('bcryptjs');
console.log('userModel.js');
class User {
    static async findOne(condition) {
        // Ensure the condition has a valid key and value
        const column = Object.keys(condition)[0];
        const value = condition[column];
        console.log('Searching for user with email:', username);
        if (!column || !value) {
            throw new Error('Invalid condition provided to findOne');
        }
    
        const query = `SELECT * FROM USERS WHERE ${column} = $1`;
    
        try {
            const result = await db.query(query, [value]);
            return result.rows[0]; // Returns the first matching row, or null if none found
        } catch (error) {
            console.error('Error finding user:', error);
            throw error;
        }
    }

  static async create(userData) {
    const { U_EMAIL, U_PASSW, U_FNAME, U_LNAME } = userData;
    const query = `
      INSERT INTO USERS(U_EMAIL, U_PASSW, U_FNAME, U_LNAME)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    try {
      const hashedPassword = await bcrypt.hash(U_PASSW, 10);
      const values = [U_EMAIL, hashedPassword, U_FNAME, U_LNAME];
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async updateFaceData(userId, faceData) {
    const query = `
      UPDATE USERS
      SET U_FACE_DATA = $1
      WHERE U_ID = $2
      RETURNING *
    `;
    try {
      const values = [JSON.stringify(faceData), userId];
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating face data:', error);
      throw error;
    }
  }

  static async comparePassword(providedPassword, storedPassword) {
    try {
      return await bcrypt.compare(providedPassword, storedPassword);
    } catch (error) {
      console.error('Error comparing passwords:', error);
      throw error;
    }
  }
}

module.exports = User;


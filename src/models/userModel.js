// userModel.js

const db = require('../db');
const bcrypt = require('bcryptjs');
console.log('userModel.js');

class User {
    /**
     * Finds a user based on a condition.
     * @param {Object} condition - The condition to search for (e.g., { u_email: 'email@example.com' }).
     * @param {Float32Array} faceData - The face descriptor data.
     * @returns {Object|null} - The user object if found, else null.
     */
    static async findOne(condition) {
        // Ensure the condition has a valid key and value
        const column = Object.keys(condition)[0];
        const value = condition[column];
        console.log('Searching for user with:', column, '=', value);
        if (!column || !value) {
            throw new Error('Invalid condition provided to findOne');
        }
    
        // Use lowercase column names to match PostgreSQL's default
        const query = `SELECT * FROM users WHERE ${column.toLowerCase()} = $1`;
    
        try {
            const result = await db.query(query, [value]);
            return result.rows[0]; // Returns the first matching row, or null if none found
        } catch (error) {
            console.error('Error finding user:', error);
            throw error;
        }
    }

    // Fetch all users from the database
    static async find() {
        const query = `SELECT * FROM users`;
        try {
            const result = await db.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    }

    /**
     * Creates a new user.
     * @param {Object} userData - The data for the new user.
     * @returns {Object} - The newly created user.
     */
    static async create(userData) {
      const { 
          u_email, 
          u_passw, 
          u_fname, 
          u_lname, 
          u_stud_id, 
          u_address, 
          u_phone, 
          u_bdate, 
          u_gender, 
          u_civstatus 
      } = userData;
  
      console.log('Creating user with data:', userData); // Debugging line
  
      const query = `
          INSERT INTO users(
              u_email, 
              u_passw, 
              u_fname, 
              u_lname, 
              u_stud_id, 
              u_address, 
              u_phone, 
              u_bdate, 
              u_gender, 
              u_civstatus
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *
      `;
      const values = [
          u_email, 
          u_passw, 
          u_fname, 
          u_lname, 
          u_stud_id, 
          u_address, 
          u_phone, 
          u_bdate, 
          u_gender, 
          u_civstatus
      ];
  
      try {
          const result = await db.query(query, values);
          console.log('User created in DB:', result.rows[0]); // Debugging line
          return result.rows[0];
      } catch (error) {
          console.error('Error creating user:', error);
          throw error;
      }
  }

    /**
     * Updates the face data for a user.
     * @param {number} userId - The ID of the user.
     * @param {Float32Array} faceData - The face descriptor data.
     * @returns {Object} - The updated user object.
     */
    static async updateFaceData(userId, faceData) {
        const query = `
            UPDATE users
            SET u_face_data = $1::jsonb
            WHERE u_id = $2
            RETURNING *
        `;
        try {
            // Ensure faceData is a valid JSON array
            if (!Array.isArray(faceData)) {
                throw new Error('faceData must be a valid array.');
            }
    
            // Convert faceData to a properly formatted JSON string
            const jsonFaceData = JSON.stringify(faceData);
    
            // Log the data being sent to the database
            console.log('Updating face data with:', jsonFaceData);
    
            const values = [jsonFaceData, userId];
            const result = await db.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error updating face data:', error);
            throw error;
        }
    }

    /**
     * Compares a provided face descriptor with the stored face descriptor.
     * @param {Float32Array} providedFaceData - The face descriptor to compare with.
     * @param {Array} storedFaceData - The stored face descriptor array.
     * @returns {boolean} - True if faces match, else false.
     */
    static compareFaceDescriptors(providedFaceData, storedFaceData) {
        if (!providedFaceData || !storedFaceData) {
            console.log('Invalid face descriptors for comparison.');
            return false;
        }

        if (providedFaceData.length !== storedFaceData.length) {
            console.log('Face descriptors length mismatch.');
            return false;
        }

        // Calculate Euclidean distance
        let distance = 0;
        for (let i = 0; i < providedFaceData.length; i++) {
            distance += Math.pow(providedFaceData[i] - storedFaceData[i], 2);
        }
        distance = Math.sqrt(distance);

        console.log(`Face descriptor distance: ${distance}`);

        return distance < 0.6;  // Threshold can be adjusted based on requirements
    }

    /**
     * Finds a user by their ID.
     * @param {number} userId - The ID of the user.
     * @returns {Object|null} - The user object if found, else null.
     */
    static async findUser(userId) {
        const query = `
            SELECT * FROM users WHERE u_id = $1
        `;
        try {
            const values = [userId];
            const result = await db.query(query, values);
            return result.rows[0];  // Return the user if found
        } catch (error) {
            console.error('Error finding user:', error);
            throw error;  // Re-throw the error to handle it elsewhere
        }
    }

    /**
     * Compares a provided password with the stored hashed password.
     * @param {string} providedPassword - The password provided by the user.
     * @param {string} storedPassword - The hashed password stored in the database.
     * @returns {boolean} - True if passwords match, else false.
     */
    static async comparePassword(providedPassword, storedPassword) {
        try {
            return await bcrypt.compare(providedPassword, storedPassword);
        } catch (error) {
            console.error('Error comparing passwords:', error);
            throw error;
        }
    }

    /**
     * Finds a user by their ID.
     * @param {number} userId - The ID of the user.
     * @returns {Object|null} - The user object if found, else null.
     */
    static async findById(userId) {
        if (!userId) throw new Error('User ID is required.');

        const query = `SELECT * FROM users WHERE u_id = $1`;

        try {
            const result = await db.query(query, [userId]);
            return result.rows[0];
        } catch (error) {
            console.error('Error fetching user:', error);
            throw error;
        }
    }

    /**
     * Updates user information by ID.
     * @param {number} userId - The ID of the user.
     * @param {Object} updatedFields - The fields to update.
     * @returns {Object} - The updated user object.
     */
    static async updateUserById(userId, updatedFields) {
        const allowedFields = ['u_lname', 'u_fname', 'u_email', 'u_stud_id', 'u_address', 'u_phone', 'u_bdate', 'u_gender', 'u_civstatus', 'u_guardian', 'u_wstatus'];
        const setClauses = [];
        const values = [];
        let index = 1;

        for (const field in updatedFields) {
            if (allowedFields.includes(field) && updatedFields[field] !== undefined) {
                setClauses.push(`${field} = $${index}`);
                values.push(updatedFields[field]);
                index++;
            }
        }

        if (setClauses.length === 0) {
            throw new Error('No valid fields provided for update.');
        }

        const query = `UPDATE users SET ${setClauses.join(', ')} WHERE u_id = $${index} RETURNING *`;
        values.push(userId);

        try {
            const result = await db.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Database update error:', error);
            throw new Error('Database update failed');
        }
    }
}

// Helper function to calculate Euclidean distance between two face descriptors
function calculateEuclideanDistance(descriptor1, descriptor2) {
    const distance = descriptor1.reduce((acc, val, index) => {
        return acc + Math.pow(val - descriptor2[index], 2);
    }, 0);
    return Math.sqrt(distance);
}


module.exports = User;

const pool = require('/src/db'); // Import your db.js file

const testDB = async () => {
    try {
        const res = await pool.query('SELECT NOW()'); // Test query
        console.log('Database Connected:', res.rows[0]);
    } catch (err) {
        console.error('Database Connection Error:', err.message);
    }
};

testDB();

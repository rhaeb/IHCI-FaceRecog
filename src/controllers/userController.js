const bcrypt = require('bcrypt');
const db = require('../models/db'); // Your database connection

exports.signup = async (req, res) => {
    const { username, email, password, faceData } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query(
            'INSERT INTO users (username, email, password, face_data) VALUES ($1, $2, $3, $4)',
            [username, email, hashedPassword, faceData]
        );
        res.status(201).json({ message: 'User registered!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
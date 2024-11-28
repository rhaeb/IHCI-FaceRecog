const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModels');

const signupUser = async (req, res) => {
    const { email, password, faceData, firstName, lastName } = req.body;

    try {
        // Check if the email already exists
        const existingUser = await userModel.findOne({ where: { U_EMAIL: email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Store user data including face descriptor
        const newUser = await userModel.create({
            U_FNAME: firstName,
            U_LNAME: lastName,
            U_EMAIL: email,
            U_PASSW: hashedPassword,
            U_FACE_DATA: JSON.stringify(faceData),  // Store face data as a JSON string
        });

        return res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Define loginUser as a const function
const loginUser = async (req, res) => {
    const { email, password, faceData } = req.body;

    try {
        // Check if the user exists
        const user = await userModel.findOne({ where: { U_EMAIL: email } });

        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Check if password is correct
        const isPasswordCorrect = await bcrypt.compare(password, user.U_PASSW);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        // Compare faceData with stored face descriptor
        if (user.U_FACE_DATA) {
            const storedFaceData = user.U_FACE_DATA;  // Assuming stored as JSONB in PostgreSQL
            const faceMatcher = new faceapi.FaceMatcher(storedFaceData);
            const match = faceMatcher.findBestMatch(faceData);

            if (match.distance < 0.6) {  // Adjust threshold as needed
                // Generate JWT token
                const token = jwt.sign({ userId: user.U_ID }, process.env.JWT_SECRET, { expiresIn: '1h' });
                return res.json({ message: 'Login successful', token });
            } else {
                return res.status(400).json({ message: 'Face data mismatch' });
            }
        }

        return res.status(400).json({ message: 'Face data not registered' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    signupUser,
    loginUser,
};
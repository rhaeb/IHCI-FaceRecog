const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const faceapi = require('face-api.js');
const db = require('../db');

const signupUser = async (req, res) => {
    const { username, password, firstName, lastName } = req.body;

    try {
        if (!username || !password || !firstName || !lastName) {
            return res.status(400).json({ message: 'All fields are required.' });
        }
        console.log('Searching for user with email:', username);
        // Check if the username already exists by searching the U_EMAIL column
        const existingUser = await User.findOne({ U_EMAIL: username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already in use' });
        }

        // Hash password before storing it
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = await User.create({
            U_EMAIL: username,
            U_PASSW: hashedPassword,
            U_FNAME: firstName,
            U_LNAME: lastName,
        });

        return res.status(201).json({ message: 'User registered successfully. Please proceed with face registration.' });
    } catch (error) {
        return res.status(500).json({ message: 'Error registering user', error: error.message });
    }
};

const registerFace = async (req, res) => {
    const { username, faceDescriptor } = req.body;

    try {
        const user = await User.findOne({ where: { U_EMAIL: username } });
        if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
            return res.status(400).json({ message: 'Invalid face descriptor' });
        }
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        user.U_FACE_DATA = JSON.stringify(faceDescriptor);
        await user.save();

        return res.status(200).json({ message: 'Face registered successfully' });
    } catch (error) {
        console.error('Error registering face:', error);
        return res.status(500).json({ message: 'Error registering face' });
    }
};

const findUser = async (req, res) => {
    const { userId } = req.params; // Extract userId from the URL

    try {
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required.' });
        }

        const user = await User.findUser(userId); // Query database for user

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({
            id: user.U_ID,
            email: user.U_EMAIL,
            firstName: user.U_FNAME,
            lastName: user.U_LNAME
        });
    } catch (error) {
        console.error('Error finding user:', error);
        return res.status(500).json({ message: 'Error finding user' });
    }
};

const loginUser = async (req, res) => {
    const { username, faceDescriptor } = req.body;

    try {
        if (!username || !faceDescriptor) {
            return res.status(400).json({ message: 'Username and face data are required.' });
        }

        const user = await User.findOne({ where: { U_EMAIL: username } });

        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        if (user.U_FACE_DATA) {
            const storedFaceData = JSON.parse(user.U_FACE_DATA);
            const faceMatcher = new faceapi.FaceMatcher(storedFaceData, 0.6);
            const match = faceMatcher.findBestMatch(faceDescriptor);

            if (match.distance < 0.6) {
                const token = jwt.sign({ userId: user.U_ID }, process.env.JWT_SECRET, { expiresIn: '1h' });
                return res.json({ 
                    message: 'Login successful', 
                    token,
                    user: {
                        id: user.U_ID,
                        username: user.U_EMAIL,
                        firstName: user.U_FNAME,
                        lastName: user.U_LNAME
                    }
                });
            } else {
                return res.status(400).json({ message: 'Face data mismatch' });
            }
        }

        return res.status(400).json({ message: 'Face data not registered' });
    } catch (error) {
        console.error('Error logging in:', error);
        return res.status(500).json({ message: 'Error logging in' });
    }
};


const getUserDetails = async (req, res) => {
    const { userId } = req.params;

    try {
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required.' });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json(user); // send back user data as JSON
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateUser = async (req, res) => {
    const userId = req.params.id;
    const { u_lname, u_fname, u_email } = req.body;

    try {
        const result = await User.updateUserById(userId, { u_lname, u_fname, u_email });
        res.status(200).json({ message: 'User updated successfully', result });
    } catch (error) {
        console.error('Database update error:', error);
        res.status(500).json({ message: 'Database update failed', error: error.message });
    }
};

module.exports = {
    signupUser,
    registerFace,
    loginUser,
    findUser,
    getUserDetails,
    updateUser
};
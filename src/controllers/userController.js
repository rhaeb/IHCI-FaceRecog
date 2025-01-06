// usercontroller.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const faceapi = require('face-api.js');
const moment = require('moment');

/**
 * Calculates age based on the provided birth date.
 * @param {string} birthDate - The birth date in YYYY-MM-DD format.
 * @returns {number} - The calculated age.
 */
function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDifference = today.getMonth() - birth.getMonth();

    // Adjust age if the birthday hasn't occurred yet this year
    if (
        monthDifference < 0 || 
        (monthDifference === 0 && today.getDate() < birth.getDate())
    ) {
        age--;
    }

    return age;
}

/**
 * Registers a new user.
 */
const signupUser = async (req, res) => {
    console.log('Received signup data:', JSON.stringify(req.body, null, 2)); // Enhanced logging
    const { 
        email, 
        //password, 
        firstName, 
        lastName, 
        studentId, 
        address, 
        phone, 
        birthDate, 
        gender, 
        civilStatus 
    } = req.body;

    try {
        // Validate required fields ; || !password
        if (!email || !firstName || !lastName || !studentId || !address || !phone || !birthDate || !gender || !civilStatus) {
            console.log('Signup failed: Missing required fields.');
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Parse studentId to integer
        const parsedStudentId = parseInt(studentId, 10);
        if (isNaN(parsedStudentId)) {
            console.log('Signup failed: studentId is not a valid number.');
            return res.status(400).json({ message: 'Student ID must be a valid number.' });
        }

        console.log('Parsed studentId:', parsedStudentId);

        console.log('Searching for user with email:', email);
        // Check if the email already exists by searching the u_email column
        const existingUser = await User.findOne({ u_email: email });
        if (existingUser) {
            console.log('Signup failed: email already in use.');
            return res.status(400).json({ message: 'email already in use' });
        }

        // Check if the student ID already exists
        console.log('Checking for existing student ID:', parsedStudentId);
        const existingStudentId = await User.findOne({ u_stud_id: parsedStudentId });
        if (existingStudentId) {
            console.log('Signup failed: Student ID already in use.');
            return res.status(400).json({ message: 'Student ID already in use' });
        }

        // Hash password before storing it
        // console.log('Hashing password.');
        // const hashedPassword = await bcrypt.hash(password, 10);
        // console.log('Password hashed.');

        // Create new user
        console.log('Creating new user in the database.');
        const newUser = await User.create({
            u_email: email,
            //u_passw: hashedPassword,
            u_fname: firstName,
            u_lname: lastName,
            u_stud_id: parsedStudentId,
            u_address: address,
            u_phone: phone,
            u_bdate: birthDate,
            u_gender: gender,
            u_civstatus: civilStatus
        });

        console.log('User registered successfully:', newUser.u_id);
        return res.status(201).json({ message: 'User registered successfully. Please proceed with face registration.' });
    } catch (error) {
        console.error('Error registering user:', error);
        return res.status(500).json({ message: 'Error registering user', error: error.message });
    }
};

/**
 * Registers face data for a user.
 */
const registerFace = async (req, res) => {
    const { email, faceDescriptor } = req.body;

    try {
        console.log('Registering face for user:', email);
        const user = await User.findOne({ u_email: email });

        if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
            console.log('RegisterFace failed: Invalid face descriptor.');
            return res.status(400).json({ message: 'Invalid face descriptor' });
        }

        if (!user) {
            console.log('RegisterFace failed: User not found.');
            return res.status(400).json({ message: 'User not found' });
        }

        // Validate faceDescriptor length and contents
        const EXPECTED_DESCRIPTOR_LENGTH = 128; // Adjust based on your face embedding model
        if (
            faceDescriptor.length !== EXPECTED_DESCRIPTOR_LENGTH ||
            !faceDescriptor.every(num => typeof num === 'number' && !isNaN(num))
        ) {
            console.log('RegisterFace failed: Face descriptor has invalid length or contains non-numeric values.');
            return res.status(400).json({ message: 'Invalid face descriptor format.' });
        }

        // Convert to standard array
        const descriptorArray = Array.from(faceDescriptor);

        // Log the descriptorArray to verify its structure
        console.log('Descriptor Array:', descriptorArray);

        // Update face data in the database
        await User.updateFaceData(user.u_id, descriptorArray);

        console.log('Face registered successfully for user:', user.u_id);
        return res.status(200).json({ message: 'Face registered successfully' });
    } catch (error) {
        console.error('Error registering face:', error);
        return res.status(500).json({ message: 'Error registering face' });
    }
};

/**
 * Finds a user by ID and returns their details including age.
 */
const findUser = async (req, res) => {
    const { userId } = req.params; // Extract userId from the URL

    try {
        if (!userId) {
            console.log('FindUser failed: User ID is required.');
            return res.status(400).json({ message: 'User ID is required.' });
        }

        console.log('Fetching user with ID:', userId);
        const user = await User.findUser(userId); // Query database for user

        if (!user) {
            console.log('FindUser failed: User not found.');
            return res.status(404).json({ message: 'User not found' });
        }

        // Calculate age
        const age = calculateAge(user.u_bdate);

        console.log('User found:', user.u_id, 'Age:', age);
        return res.status(200).json({
            id: user.u_id,
            email: user.u_email,
            firstName: user.u_fname,
            lastName: user.u_lname,
            age: age
        });
    } catch (error) {
        console.error('Error finding user:', error);
        return res.status(500).json({ message: 'Error finding user' });
    }
};

/**
 * Logs in a user using face recognition.
 */
const loginUser = async (req, res) => {
    const { faceDescriptor } = req.body;

    try {
        if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
            console.log('Login failed: Invalid or missing face data.');
            return res.status(400).json({ message: 'Invalid face data.' });
        }

        console.log('Attempting login using face recognition');

        // Fetch all users and their stored face data
        const users = await User.find();

        if (!users || users.length === 0) {
            console.log('Login failed: No users found.');
            return res.status(400).json({ message: 'No users found' });
        }

        let matchedUser = null;
        let smallestDistance = Infinity;

        // Convert providedFaceDescriptor to Float32Array once
        const providedFaceData = new Float32Array(faceDescriptor);

        // Loop through all users and compare face data
        for (let user of users) {
            if (user.u_face_data) {
                console.log(`Parsing face data for user ID: ${user.u_id}`);
                console.log(`Stored u_face_data: ${JSON.stringify(user.u_face_data)}`);

                try {
                    const storedFaceData = user.u_face_data;

                    // Validate storedFaceData structure
                    if (!Array.isArray(storedFaceData)) {
                        console.error(`Stored u_face_data for user ID ${user.u_id} is not an array.`);
                        continue; // Skip this user
                    }

                    const comparisonResult = User.compareFaceDescriptors(providedFaceData, storedFaceData);
                    const { isMatch, distance } = comparisonResult;
                    console.log(`User ID ${user.u_id} - Distance: ${distance} - Match: ${isMatch}`);

                    if (isMatch) {
                        if (distance < smallestDistance) {
                            smallestDistance = distance;
                            matchedUser = user;
                        }
                    }
                } catch (error) {
                    console.error(`Error processing u_face_data for user ID ${user.u_id}:`, error);
                    continue; // Skip this user and proceed to the next
                }
            }
        }

        if (matchedUser && smallestDistance < 0.4) { // Ensure the smallest distance is below the threshold
            // Successful login, generate JWT token
            const token = jwt.sign({ userId: matchedUser.u_id }, process.env.JWT_SECRET, { expiresIn: '1h' });

            // Calculate the user's age
            const age = calculateAge(matchedUser.u_bdate);

            // Generate random background color
            const backgroundColor = generateRandomColor();

            return res.json({
                message: 'Login successful',
                token,
                user: {
                    id: matchedUser.u_id,
                    email: matchedUser.u_email,
                    firstName: matchedUser.u_fname,
                    lastName: matchedUser.u_lname,
                    age: age,
                    backgroundColor  // Add the random color here
                }
            });
        } else {
            console.log('Login failed: No matching face data.');
            return res.status(400).json({ message: 'No matching face data.' });
        }
    } catch (error) {
        console.error('Error logging in:', error);
        return res.status(500).json({ message: 'Error logging in' });
    }
};

// Helper function to generate random color
function generateRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

/**
 * Logs in a user using email and password.
 */
const loginWithPassword = async (req, res) => {
    const { email, password } = req.body;

    try {
        console.log('Attempting login for email:', email);

        // Validate required fields
        if (!email || !password) {
            console.log('Login failed: Email and password are required.');
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        // Find user by email
        const user = await User.findOne({ u_email: email });
        if (!user) {
            console.log('Login failed: User not found.');
            return res.status(400).json({ message: 'Invalid email or password.' });
        }

        // Compare provided password with stored hashed password
        const isMatch = await bcrypt.compare(password, user.u_passw);
        if (!isMatch) {
            console.log('Login failed: Incorrect password.');
            return res.status(400).json({ message: 'Invalid email or password.' });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user.u_id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        console.log('Login successful for user:', user.u_id);

        // Calculate age
        const age = calculateAge(user.u_bdate);

        return res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.u_id,
                email: user.u_email,
                firstName: user.u_fname,
                lastName: user.u_lname,
                age: age
            }
        });
    } catch (error) {
        console.error('Error during login:', error);
        return res.status(500).json({ message: 'Error logging in', error: error.message });
    }
};

/**
 * Retrieves detailed information about a user, including age.
 */
const getUserDetails = async (req, res) => {
    const { userId } = req.params;

    try {
        if (!userId) {
            console.log('GetUserDetails failed: User ID is required.');
            return res.status(400).json({ message: 'User ID is required.' });
        }

        console.log('Fetching detailed info for user ID:', userId);
        const user = await User.findById(userId);

        if (!user) {
            console.log('GetUserDetails failed: User not found.');
            return res.status(404).json({ message: 'User not found.' });
        }

        console.log('User object:', user);
        console.log('u_bdate:', user.u_bdate);

        // Calculate age
        var bdate = moment(user.u_bdate).format('YYYY-MM-DD');
        const age = calculateAge(bdate);

        console.log('User details fetched for user:', user.u_id);
        res.json({
            studentId: user.u_stud_id,
            email: user.u_email,
            firstName: user.u_fname,
            lastName: user.u_lname,
            age: age,
            birthDate: bdate,
            address: user.u_address,
            phone: user.u_phone,
            gender: user.u_gender,
            civilStatus: user.u_civstatus,
            guardian: user.u_guardian,
            workStatus: user.u_wstatus,
            createdAt: user.u_created_at
        });
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Updates user information.
 */
const updateUser = async (req, res) => {
    const userId = req.params.id;
    const { u_lname, u_fname, u_email, u_stud_id, u_address, u_phone, u_bdate, u_gender, u_civstatus, u_guardian, u_wstatus } = req.body;

    try {
        console.log('Updating user ID:', userId);
        const result = await User.updateUserById(userId, { 
            u_lname, 
            u_fname, 
            u_email,
            u_stud_id,
            u_address,
            u_phone,
            u_bdate,
            u_gender,
            u_civstatus,
            u_guardian,
            u_wstatus 
        });
        console.log('User updated successfully:', userId);
        res.status(200).json({ message: 'User updated successfully', result });
    } catch (error) {
        console.error('Database update error:', error);
        res.status(500).json({ message: 'Database update failed', error: error.message });
    }
};

const verifyToken = (req, res) => {
    res.json({ message: 'Token is valid' });
};

module.exports = {
    signupUser,
    registerFace,
    loginWithPassword,
    loginUser,
    findUser,
    getUserDetails,
    updateUser,
    verifyToken
};

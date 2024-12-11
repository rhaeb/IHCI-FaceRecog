// routes.js or wherever you define your routes

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateToken = require('../middleware/authMiddleware');

router.post('/register', userController.signupUser);
router.post('/register-face', userController.registerFace);
router.post('/login', userController.loginUser);
router.get('/:userId', authenticateToken, userController.findUser);
router.get('/details/:userId', authenticateToken, userController.getUserDetails);
router.patch('/:id', authenticateToken, userController.updateUser);

// New Route for Email/Password Login
router.post('/login-password', userController.loginWithPassword);

module.exports = router;

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
router.put('/:id', authenticateToken, userController.updateUser);
//router.post('/logout', authenticateToken, logoutUser);

// New Route for Email/Password Login
router.post('/login-password', userController.loginWithPassword);

router.post('/verify-token', authenticateToken, userController.verifyToken);


module.exports = router;

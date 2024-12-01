const express = require('express');
const router = express.Router();
const user = require('../controllers/userController');

router.post('/register', user.signupUser);
router.post('/register-face', user.registerFace);
router.post('/login', user.loginUser);
router.get('/find/:userId', user.findUser);

module.exports = router;

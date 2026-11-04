const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { loginRateLimit } = require('../middleware/loginRateLimit');

router.post('/register', authController.register);
router.post('/login', loginRateLimit, authController.login);
router.get('/me', authenticate, authController.getMe);
router.put('/profile', authenticate, authController.updateProfile);

module.exports = router;

const express = require('express');
const router = express.Router();
const { register, login, getProfile, forgotPassword, resetPassword, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth'); // Import the protect middleware

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', register);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', login);

// @route   GET /api/auth/profile
// @desc    Get current user's profile
// @access  Private
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

// @route   POST /api/auth/forgot-password
// @desc    Initiate password reset
// @access  Public
router.post('/forgot-password', forgotPassword);

// @route   POST /api/auth/reset-password/:token
// @desc    Reset password with a valid token
// @access  Public
router.post('/reset-password/:token', resetPassword);

module.exports = router;

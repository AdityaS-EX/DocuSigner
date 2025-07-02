const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
// const sendEmail = require('../utils/sendEmail'); // We'll mock this for now

// Utility function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '1d', // Token expires in 1 day
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  const { username, name, email, password } = req.body;

  // Basic validation
  if (!username || !name || !email || !password) {
    return res.status(400).json({ message: 'Please provide username, name, email, and password' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  try {
    // Check if user already exists by email or username
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
        if (existingUser.email === email) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }
        if (existingUser.username === username) {
            return res.status(400).json({ message: 'This username is already taken' });
        }
    }

    // Create and save the new user (password will be hashed by pre-save hook)
    const user = new User({ username, name, email, password });
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('Register error:', error.message);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  const { login, password } = req.body; // 'login' can be either username or email

  // Basic validation
  if (!login || !password) {
    return res.status(400).json({ message: 'Please provide login credential and password' });
  }

  try {
    // Check if user exists by username or email
    const user = await User.findOne({
      $or: [{ email: login }, { username: login }],
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // User matched, create JWT
    const token = generateToken(user._id);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private (Requires JWT Authentication)
exports.getProfile = async (req, res) => {
  try {
    // req.user is attached by the 'protect' middleware
    // Find user by ID and exclude the password field
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Get profile error:', error.message);
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Generate a random, URL-safe token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetExpires = Date.now() + 15 * 60 * 1000; // 15 minutes

    // Find user and update token fields in one atomic operation.
    // This avoids the validation error on .save() for old users missing a username.
    const user = await User.findOneAndUpdate(
      { email },
      {
        passwordResetToken: hashedToken,
        passwordResetExpires: resetExpires
      },
      { new: true } // Return the updated document
    );

    if (!user) {
      // Still send a generic success message to prevent user enumeration
      return res.status(200).json({ message: 'If a user with that email exists, a password reset link has been sent.' });
    }

    // Create the reset URL for the frontend
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    try {
        const sendEmail = require('../utils/email'); // Require the email utility
        await sendEmail({
            email: user.email, // The utility expects 'email' not 'to'
            subject: 'Password Reset Request',
            message: `You are receiving this email because you (or someone else) have requested the reset of a password. Please use the following link, which is valid for 15 minutes, to complete the process:\n\n${resetUrl}`
        });

        res.status(200).json({ message: 'If a user with that email exists, a password reset link has been sent.' });

    } catch (err) {
        console.error("Email sending error:", err);
        // If email fails, we must clear the token so the user can try again
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save(); // Consider if this save needs validation
        return res.status(500).json({ message: 'Error sending password reset email. Please try again.' });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    // req.user is attached by the 'protect' middleware
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user fields
    user.name = req.body.name || user.name;
    if (req.body.email && req.body.email !== user.email) {
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = req.body.email;
    }

    const updatedUser = await user.save();

    res.status(200).json({
      id: updatedUser._id,
      username: updatedUser.username,
      name: updatedUser.name,
      email: updatedUser.email,
    });
  } catch (error) {
    console.error('Update profile error:', error.message);
    res.status(500).json({ message: 'Server error while updating profile' });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
  }

  // Hash the incoming token so we can find it in the database
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  try {
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }, // Check that the token has not expired
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired password reset token.' });
    }

    // --- Data Healing ---
    // If the user is an old record without a username, create one to pass validation.
    if (!user.username) {
        user.username = user.email.split('@')[0] + Math.floor(100 + Math.random() * 900);
    }

    // Token is valid. Set the new password.
    user.password = password; // The pre-save hook will hash it automatically
    // Clear the reset token fields
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    
    // Optional: Log the user in immediately by sending back a new JWT token
    const jwtToken = generateToken(user._id);
    res.status(200).json({ 
        message: 'Password has been reset successfully.',
        token: jwtToken
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

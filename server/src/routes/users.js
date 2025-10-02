const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const { authenticateToken, requireAdmin, requireOwnershipOrAdmin, optionalAuth } = require('../middleware/auth');
const { 
  validateUserRegistration, 
  validateUserLogin, 
  validateUserUpdate, 
  validatePasswordChange 
} = require('../middleware/validation');

// @route   POST /api/users/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateUserRegistration, async (req, res) => {
  try {
    const { email, password, firstName, lastName, username } = req.body;
    
    const user = await userService.createUser({
      email,
      password,
      firstName,
      lastName,
      username
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/users/login
// @desc    Login user
// @access  Public
router.post('/login', validateUserLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await userService.authenticateUser(email, password);

    res.json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: { user: req.user }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update current user profile
// @access  Private
router.put('/profile', authenticateToken, validateUserUpdate, async (req, res) => {
  try {
    const updatedUser = await userService.updateUser(req.user.id, req.body);
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/users/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', authenticateToken, validatePasswordChange, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    await userService.changePassword(req.user.id, oldPassword, newPassword);
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Only return public profile info
    const publicUser = {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      profile: user.profile,
      createdAt: user.createdAt
    };

    // If user has public profile disabled, only show basic info
    if (!user.settings?.publicProfile && (!req.user || req.user.id !== user.id)) {
      publicUser.profile = { avatar: user.profile?.avatar || '' };
    }

    res.json({
      success: true,
      data: { user: publicUser }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get user'
    });
  }
});

// Legacy support for old userId parameter
router.get('/:userId', optionalAuth, async (req, res) => {
  req.params.id = req.params.userId;
  // Continue to the same handler
});

module.exports = router;
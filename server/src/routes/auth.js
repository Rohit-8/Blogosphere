const express = require('express');
const { getAuth } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Get current user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await getAuth().getUser(req.user.uid);
    
    res.json({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
      emailVerified: user.emailVerified,
      createdAt: user.metadata.creationTime,
      lastLoginAt: user.metadata.lastSignInTime
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// Update user profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { displayName, photoURL } = req.body;
    
    const updateData = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (photoURL !== undefined) updateData.photoURL = photoURL;
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    await getAuth().updateUser(req.user.uid, updateData);
    
    const updatedUser = await getAuth().getUser(req.user.uid);
    
    res.json({
      uid: updatedUser.uid,
      email: updatedUser.email,
      displayName: updatedUser.displayName || null,
      photoURL: updatedUser.photoURL || null,
      emailVerified: updatedUser.emailVerified
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// Delete user account
router.delete('/account', verifyToken, async (req, res) => {
  try {
    await getAuth().deleteUser(req.user.uid);
    res.json({ message: 'User account deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user account' });
  }
});

// Verify email
router.post('/verify-email', verifyToken, async (req, res) => {
  try {
    const actionCodeSettings = {
      url: process.env.CLIENT_URL || 'http://localhost:3000',
      handleCodeInApp: false
    };
    
    const link = await getAuth().generateEmailVerificationLink(
      req.user.email,
      actionCodeSettings
    );
    
    res.json({ 
      message: 'Verification email sent',
      verificationLink: link
    });
  } catch (error) {
    console.error('Send verification email error:', error);
    res.status(500).json({ error: 'Failed to send verification email' });
  }
});

module.exports = router;
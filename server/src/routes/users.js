const express = require('express');
const { getAuth } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Get user by ID
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await getAuth().getUser(userId);
    
    // Return only public information
    res.json({
      uid: user.uid,
      displayName: user.displayName || 'Anonymous User',
      photoURL: user.photoURL || null,
      createdAt: user.metadata.creationTime
    });
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ error: 'User not found' });
    }
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user information' });
  }
});

module.exports = router;
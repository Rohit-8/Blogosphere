const { getFirestore } = require('../config/firebase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class UserService {
  constructor() {
    // Users are stored in blogosphere/users collection
  }

  // Lazy initialization of Firestore
  getDB() {
    if (!this.db) {
      this.db = getFirestore();
    }
    return this.db;
  }

  // Get the users collection reference
  getUsersCollection() {
    return this.getDB().collection('blogosphere').doc('users').collection('users');
  }

  // Get blogosphere users collection
  getUsersCollection() {
    return this.getDB().collection('blogosphere').doc('users').collection('users');
  }

  // Generate JWT token
  generateToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET || 'blogosphere-super-secret-jwt-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  // Hash password
  async hashPassword(password) {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    return await bcrypt.hash(password, rounds);
  }

  // Verify password
  async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Create a new user
  async createUser(userData) {
    try {
      const { email, password, firstName, lastName, username } = userData;

      // Check if user already exists
      const existingUser = await this.getUserByEmail(email);
      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      // Check if username already exists
      if (username) {
        const existingUsername = await this.getUserByUsername(username);
        if (existingUsername) {
          throw new Error('Username already taken');
        }
      }

      // Hash password
      const hashedPassword = await this.hashPassword(password);

      // Create user document
      const userDoc = {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName: firstName || '',
        lastName: lastName || '',
        username: username || email.split('@')[0],
        role: 'user',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: {
          bio: '',
          avatar: '',
          location: '',
          website: ''
        },
        settings: {
          emailNotifications: true,
          publicProfile: true
        }
      };

      // Save to Firestore
      const docRef = await this.getUsersCollection().add(userDoc);
      
      // Get the created user (without password)
      const newUser = { id: docRef.id, ...userDoc };
      delete newUser.password;

      return newUser;
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  // Authenticate user (login)
  async authenticateUser(email, password) {
    try {
      const user = await this.getUserByEmail(email, true); // Include password
      
      if (!user) {
        throw new Error('Invalid credentials');
      }

      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      const isValidPassword = await this.verifyPassword(password, user.password);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Generate token
      const token = this.generateToken(user.id);

      // Update last login
      await this.updateUser(user.id, { lastLoginAt: new Date() });

      // Remove password from response
      delete user.password;

      return {
        user,
        token
      };
    } catch (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  // Get user by ID
  async getUserById(userId, includePassword = false) {
    try {
      const doc = await this.getUsersCollection().doc(userId).get();
      
      if (!doc.exists) {
        return null;
      }

      const user = { id: doc.id, ...doc.data() };
      
      if (!includePassword) {
        delete user.password;
      }

      return user;
    } catch (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  // Get user by email
  async getUserByEmail(email, includePassword = false) {
    try {
      const querySnapshot = await this.getUsersCollection()
        .where('email', '==', email.toLowerCase())
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      const user = { id: doc.id, ...doc.data() };
      
      if (!includePassword) {
        delete user.password;
      }

      return user;
    } catch (error) {
      throw new Error(`Failed to get user by email: ${error.message}`);
    }
  }

  // Get user by username
  async getUserByUsername(username, includePassword = false) {
    try {
      const querySnapshot = await this.getUsersCollection()
        .where('username', '==', username)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      const user = { id: doc.id, ...doc.data() };
      
      if (!includePassword) {
        delete user.password;
      }

      return user;
    } catch (error) {
      throw new Error(`Failed to get user by username: ${error.message}`);
    }
  }

  // Update user
  async updateUser(userId, updateData) {
    try {
      const updates = {
        ...updateData,
        updatedAt: new Date()
      };

      // Hash password if it's being updated
      if (updates.password) {
        updates.password = await this.hashPassword(updates.password);
      }

      await this.getUsersCollection().doc(userId).update(updates);
      
      return await this.getUserById(userId);
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  // Delete user
  async deleteUser(userId) {
    try {
      await this.getUsersCollection().doc(userId).delete();
      return true;
    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  // Get all users (admin only)
  async getAllUsers(options = {}) {
    try {
      const { limit = 50, offset = 0, role, isActive } = options;
      
      let query = this.getUsersCollection();
      
      if (role) {
        query = query.where('role', '==', role);
      }
      
      if (isActive !== undefined) {
        query = query.where('isActive', '==', isActive);
      }
      
      query = query.orderBy('createdAt', 'desc').limit(limit).offset(offset);
      
      const querySnapshot = await query.get();
      
      const users = [];
      querySnapshot.forEach(doc => {
        const user = { id: doc.id, ...doc.data() };
        delete user.password; // Never include passwords in list
        users.push(user);
      });

      return users;
    } catch (error) {
      throw new Error(`Failed to get users: ${error.message}`);
    }
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'blogosphere-super-secret-jwt-key');
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Change password
  async changePassword(userId, oldPassword, newPassword) {
    try {
      const user = await this.getUserById(userId, true);
      
      if (!user) {
        throw new Error('User not found');
      }

      const isValidPassword = await this.verifyPassword(oldPassword, user.password);
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      await this.updateUser(userId, { password: newPassword });
      return true;
    } catch (error) {
      throw new Error(`Failed to change password: ${error.message}`);
    }
  }

  // Reset password (admin function or with email verification)
  async resetPassword(email, newPassword) {
    try {
      const user = await this.getUserByEmail(email);
      
      if (!user) {
        throw new Error('User not found');
      }

      await this.updateUser(user.id, { password: newPassword });
      return true;
    } catch (error) {
      throw new Error(`Failed to reset password: ${error.message}`);
    }
  }
}

module.exports = new UserService();
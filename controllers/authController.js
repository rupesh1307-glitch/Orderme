const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'orderme_super_secret_jwt_key_2026_secure';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// POST /api/auth/register
function register(req, res) {
  try {
    const { name, email, password, phone, address, city, pincode } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, phone, address, city, pincode)
      VALUES (?, ?, ?, 'customer', ?, ?, ?, ?)
    `).run(name.trim(), cleanEmail, passwordHash, phone || null, address || null, city || null, pincode || null);

    const newUser = db.prepare(`
      SELECT id, name, email, role, phone, address, city, pincode, created_at
      FROM users WHERE id = ?
    `).get(result.lastInsertRowid);

    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: newUser
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create account. Please try again.'
    });
  }
}

// POST /api/auth/login
function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      city: user.city,
      pincode: user.pincode,
      created_at: user.created_at
    };

    const token = generateToken(safeUser);

    res.json({
      success: true,
      message: 'Logged in successfully!',
      token,
      user: safeUser
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
}

// GET /api/auth/me
function getMe(req, res) {
  try {
    const user = db.prepare(`
      SELECT id, name, email, role, phone, address, city, pincode, created_at
      FROM users WHERE id = ?
    `).get(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile.'
    });
  }
}

// PUT /api/auth/profile
function updateProfile(req, res) {
  try {
    const { name, phone, address, city, pincode, currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    let passwordHash = user.password_hash;
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to set a new password.'
        });
      }
      const isMatch = bcrypt.compareSync(currentPassword, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password does not match.'
        });
      }
      const salt = bcrypt.genSaltSync(10);
      passwordHash = bcrypt.hashSync(newPassword, salt);
    }

    db.prepare(`
      UPDATE users
      SET name = ?, phone = ?, address = ?, city = ?, pincode = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name ? name.trim() : user.name,
      phone !== undefined ? phone : user.phone,
      address !== undefined ? address : user.address,
      city !== undefined ? city : user.city,
      pincode !== undefined ? pincode : user.pincode,
      passwordHash,
      userId
    );

    const updatedUser = db.prepare(`
      SELECT id, name, email, role, phone, address, city, pincode, created_at
      FROM users WHERE id = ?
    `).get(userId);

    res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile.'
    });
  }
}

module.exports = {
  register,
  login,
  getMe,
  updateProfile
};

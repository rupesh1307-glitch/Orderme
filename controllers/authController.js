const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/db');
const { getJwtSecret } = require('../config/jwt');

const PASSWORD_MIN_LENGTH = 8;

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d', algorithm: 'HS256' }
  );
}

function isValidEmail(email) {
  return typeof email === 'string' &&
    email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// POST /api/auth/register
async function register(req, res) {
  try {
    const { name, email, password, phone, address, city, pincode } = req.body || {};
    if (typeof name !== 'string' || !name.trim() || !isValidEmail(email) ||
        typeof password !== 'string' || !password) {
      return res.status(400).json({
        success: false,
        message: 'A valid name, email, and password are required.'
      });
    }

    if (name.trim().length > 100 || password.length < PASSWORD_MIN_LENGTH || password.length > 72) {
      return res.status(400).json({
        success: false,
        message: 'Name must be at most 100 characters and password must be 8–72 characters long.'
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

    const passwordHash = await bcrypt.hash(password, 12);
    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, phone, address, city, pincode)
      VALUES (?, ?, ?, 'customer', ?, ?, ?, ?)
    `).run(name.trim(), cleanEmail, passwordHash, phone || null, address || null, city || null, pincode || null);

    const newUser = db.prepare(`
      SELECT id, name, email, role, phone, address, city, pincode, created_at
      FROM users WHERE id = ?
    `).get(result.lastInsertRowid);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token: generateToken(newUser),
      user: newUser
    });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ success: false, message: 'An account with this email address already exists.' });
    }
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create account. Please try again.' });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!isValidEmail(email) || typeof password !== 'string' || !password || password.length > 72) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email and password.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
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

    return res.json({
      success: true,
      message: 'Logged in successfully!',
      token: generateToken(safeUser),
      user: safeUser
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
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
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }
    return res.json({ success: true, user });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch user profile.' });
  }
}

// PUT /api/auth/profile
async function updateProfile(req, res) {
  try {
    const { name, phone, address, city, pincode, currentPassword, newPassword } = req.body || {};
    const userId = req.user.id;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (name !== undefined && (typeof name !== 'string' || !name.trim() || name.trim().length > 100)) {
      return res.status(400).json({ success: false, message: 'Name must contain 1–100 characters.' });
    }

    let passwordHash = user.password_hash;
    if (newPassword !== undefined && newPassword !== '') {
      if (typeof newPassword !== 'string' || newPassword.length < PASSWORD_MIN_LENGTH || newPassword.length > 72) {
        return res.status(400).json({ success: false, message: 'New password must be 8–72 characters long.' });
      }
      if (typeof currentPassword !== 'string' || !currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password is required to set a new password.' });
      }
      if (!(await bcrypt.compare(currentPassword, user.password_hash))) {
        return res.status(400).json({ success: false, message: 'Current password does not match.' });
      }
      passwordHash = await bcrypt.hash(newPassword, 12);
    }

    db.prepare(`
      UPDATE users
      SET name = ?, phone = ?, address = ?, city = ?, pincode = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name !== undefined ? name.trim() : user.name,
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

    return res.json({ success: true, message: 'Profile updated successfully!', user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
}

module.exports = { register, login, getMe, updateProfile };

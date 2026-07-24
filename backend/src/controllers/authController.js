import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import crypto from 'crypto';
import db from '../db.js';

const registerSchema = z.zod ? z.zod({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(['organizer', 'vendor', 'attendee']).default('organizer')
}) : z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(['organizer', 'vendor', 'attendee']).default('organizer')
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(['organizer', 'vendor', 'attendee']).optional()
});

export const register = async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { email, password, name, role } = validatedData;

    // Check if user already exists
    const checkUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    // Insert user
    await db.query(
      'INSERT INTO users (id, email, password_hash, name, role) VALUES ($1, $2, $3, $4, $5)',
      [userId, email, passwordHash, name, role]
    );

    // Create JWT
    const token = jwt.sign(
      { id: userId, email, role },
      process.env.JWT_SECRET || 'supersecretjwtkeychangeinprod',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: userId, email, name, role }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map(e => e.message).join(', ') });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
};

export const login = async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;

    // Retrieve user
    const checkUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (checkUser.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const user = checkUser.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // Create JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'supersecretjwtkeychangeinprod',
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map(e => e.message).join(', ') });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const userResult = await db.query('SELECT id, email, name, role, created_at FROM users WHERE id = $1', [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.status(200).json(userResult.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const validatedData = updateProfileSchema.parse(req.body);
    const { name, email, role } = validatedData;

    // Fetch user current data
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const currentUser = userResult.rows[0];
    const newName = name !== undefined ? name : currentUser.name;
    const newEmail = email !== undefined ? email : currentUser.email;
    const newRole = role !== undefined ? role : currentUser.role;

    // If changing email, check uniqueness
    if (newEmail !== currentUser.email) {
      const checkEmail = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [newEmail, userId]);
      if (checkEmail.rows.length > 0) {
        return res.status(400).json({ error: 'Email already in use.' });
      }
    }

    await db.query(
      'UPDATE users SET name = $1, email = $2, role = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
      [newName, newEmail, newRole, userId]
    );

    // Issue updated token
    const token = jwt.sign(
      { id: userId, email: newEmail, role: newRole },
      process.env.JWT_SECRET || 'supersecretjwtkeychangeinprod',
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Profile updated successfully',
      token,
      user: { id: userId, email: newEmail, name: newName, role: newRole }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map(e => e.message).join(', ') });
    }
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

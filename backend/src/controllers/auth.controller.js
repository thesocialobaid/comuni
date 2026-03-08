/* 
auth.controller.js - Registration and login 
--> Here we are using bycrypt to hash the password before we save it to the database.
--> Using JWT because the JSON web Tokens let the client prove who they are on every request 
without the server starting session state. The token is signed with our 
JWT_SECRET so we can verify it hasn't been tampered with.
*/

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); 
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db'); 

// Helper functions 
function generateToken(student) { 
    return jwt.sign( 
        { 
            studentId: student.studentId, 
            rollNumber: student.rollNumber,
            email: student.email, 
        }, 
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    ); 
}

// Registering a new user 
/* 
POST /api/auth/register 
Request Type: multipart/form-data (because of the profile picture upload)
Fields: rollNumber, email, password, name, profilePicture (file), bio 

In Postman to check the form add we are going to be adding each field, and setting the profile picture type
to "File"

*/

async function register(req, res, next) {
  try {
    const { rollNumber, email, password, name, bio } = req.body;

    // req.file is populated by the uploadProfilePicture multer middleware (in the route).
    // If the student did not upload a photo, req.file is undefined — that is fine, it is optional.
    const profilePicture = req.file
      ? `/uploads/profiles/${req.file.filename}`
      : null;

    // ── Basic validation ──────────────────────────────────────────────────
    if (!rollNumber || !email || !password || !name) {
      // If a file was uploaded but validation fails, delete it from disk
      // so we don't accumulate orphan files
      if (req.file) fs.unlinkSync(req.file.path);

      return res.status(400).json({
        success: false,
        message: 'rollNumber, email, password, and name are required.',
      });
    }

    if (password.length < 6) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    const nuEmailRegex = /^[^\s@]+@([a-z0-9-]+\.)?nu\.edu\.pk$/i;
    if (!nuEmailRegex.test(email)) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Email must be a valid NU email address (ending with @nu.edu.pk).',
      });
    }

    // ── Roll Number Format Validation ─────────────────────────────────────
    const rollRegex = /^\d{2}[A-Z]-\d{4}$/;

    if (!rollRegex.test(rollNumber)) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: "Roll number must be in format: 24L-0698",
      });
    }

    // Extract parts from roll number
    const rollMatch = rollNumber.match(/^(\d{2})([A-Z])-(\d{4})$/);

    const batch = rollMatch[1];       // 24
    const campusLetter = rollMatch[2]; // L
    const rollDigits = rollMatch[3];   // 0698

    // ── Email Format Validation ───────────────────────────────────────────
    const emailRegex = /^([a-z])(\d{2})(\d{4})@([a-z]+)\.nu\.edu\.pk$/i;

    const emailMatch = email.match(emailRegex);

    if (!emailMatch) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: "Email must be a valid NU email (e.g. l240698@lhr.nu.edu.pk)",
      });
    }

    // Extract parts from email
    const emailCampusLetter = emailMatch[1].toUpperCase();
    const emailBatch = emailMatch[2];
    const emailRoll = emailMatch[3];

    // ── Cross-check Roll Number with Email ─────────────────────────────────
    if (
      campusLetter !== emailCampusLetter ||
      batch !== emailBatch ||
      rollDigits !== emailRoll
    ) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: "Email does not match the provided roll number.",
      });
    }

    //Checking the uniqueness (before hashing to save CPU)
    const [existing] = await pool.query(
      'SELECT studentId FROM Student WHERE email = ? OR rollNumber = ? LIMIT 1',
      [email, rollNumber]
    );

    if (existing.length > 0) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'A student with this email or roll number already exists.',
      });
    }

    // Hashing the password
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    const passwordHash = await bcrypt.hash(password, rounds);

    // Inserting the students 
    const [result] = await pool.query(
      'INSERT INTO Student (rollNumber, email, passwordHash, name, profilePicture, bio) VALUES (?, ?, ?, ?, ?, ?)',
      [rollNumber, email, passwordHash, name, profilePicture, bio || null]
    );

    const studentId = result.insertId;

    // Fetch the new row to return (never expose passwordHash)
    const [rows] = await pool.query(
      `SELECT studentId, rollNumber, email, name, bio, profilePicture,
              workerRating, giverRating, totalVouchCount,
              jobsPostedCount, jobsCompletedCount, verifiedReviewer, createdAt
       FROM Student WHERE studentId = ?`,
      [studentId]
    );

    const student = rows[0];

    // Generate JWT 
    const token = generateToken(student);

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token,
      student,
    });
  } catch (err) {
    // If any DB error happens after file was saved, clean up the file
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch (_) { }
    }
    next(err);
  }
} 

// Login 
/**
 * POST /api/auth/login
 * Body (JSON): { email, password }
 *
 * Note: We accept login by email OR rollNumber.  The client can send either
 * in the "email" field and we handle both.
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email (or roll number) and password are required.',
      });
    }

    // ── Look up student by email OR rollNumber ────────────────────────────
    const [rows] = await pool.query(
      `SELECT studentId, rollNumber, email, name, bio, profilePicture,
              passwordHash, workerRating, giverRating, totalVouchCount,
              jobsPostedCount, jobsCompletedCount, verifiedReviewer,
              deletedAt
       FROM Student
       WHERE (email = ? OR rollNumber = ?) AND deletedAt IS NULL
       LIMIT 1`,
      [email, email]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    const student = rows[0];

    // ── Verify password ───────────────────────────────────────────────────
    const passwordMatch = await bcrypt.compare(password, student.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    delete student.passwordHash;
    delete student.deletedAt;

    const token = generateToken(student);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      student,
    });
  } catch (err) {
    next(err);
  }
}

// ─── Get current user ─────────────────────────────────────────────────────────

/**
 * GET /api/auth/me
 * Header: Authorization: Bearer <token>
 */
async function getMe(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT studentId, rollNumber, email, name, bio, profilePicture,
              workerRating, workerRatingCount, giverRating, giverRatingCount,
              jobsPostedCount, jobsCompletedCount, totalVouchCount,
              verifiedReviewer, createdAt
       FROM Student
       WHERE studentId = ? AND deletedAt IS NULL`,
      [req.user.studentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, student: rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, getMe };


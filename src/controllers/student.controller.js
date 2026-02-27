/**
 * student.controller.js — Student Profiles & Skills
 *
 * Covers:
 *  - Get any student's public profile
 *  - Update own profile (name, bio, profilePicture)
 *  - Soft-delete account
 *  - Add / update / remove skills on own profile
 *  - List own skills
 */

const { pool } = require('../config/db');

// ─── Profiles ─────────────────────────────────────────────────────────────────

/**
 * GET /api/students/:studentId
 * Public — returns profile + skills + vouch count.
 */
async function getStudentById(req, res, next) {
  try {
    const { studentId } = req.params;

    // 1. Basic profile
    const [rows] = await pool.query(
      `SELECT studentId, rollNumber, name, bio, profilePicture,
              workerRating, workerRatingCount, giverRating, giverRatingCount,
              jobsPostedCount, jobsCompletedCount, totalVouchCount,
              verifiedReviewer, createdAt,
              -- Completion rate derived on the fly (avoid dividing by zero)
              CASE
                WHEN jobsPostedCount = 0 THEN 0
                ELSE ROUND(jobsCompletedCount / jobsPostedCount * 100, 1)
              END AS completionRate
       FROM Student
       WHERE studentId = ? AND deletedAt IS NULL`,
      [studentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    // 2. Their skills
    const [skills] = await pool.query(
      `SELECT ss.studentSkillId, s.skillId, s.skillName, s.category,
              ss.proficiencyLevel, ss.relevantComp, ss.addedAt
       FROM StudentSkill ss
       JOIN Skill s ON s.skillId = ss.skillId
       WHERE ss.studentId = ?
       ORDER BY ss.proficiencyLevel DESC`,
      [studentId]
    );

    res.json({
      success: true,
      student: { ...rows[0], skills },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/students
 * List all active students (for discovery / admin).
 * Supports ?search=name query param.
 */
async function listStudents(req, res, next) {
  try {
    const search = req.query.search ? `%${req.query.search}%` : '%';

    const [rows] = await pool.query(
      `SELECT studentId, rollNumber, name, bio, profilePicture,
              workerRating, totalVouchCount, verifiedReviewer,
              jobsCompletedCount
       FROM Student
       WHERE deletedAt IS NULL
         AND (name LIKE ? OR rollNumber LIKE ?)
       ORDER BY workerRating DESC
       LIMIT 50`,
      [search, search]
    );

    res.json({ success: true, count: rows.length, students: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/students/me
 * Update the logged-in student's own profile.
 * Only allows safe fields — you cannot change email or rollNumber here.
 */
async function updateMyProfile(req, res, next) {
  try {
    const studentId = req.user.studentId;
    const { name, bio, profilePicture } = req.body;

    // Build SET clause dynamically — only update what was sent
    const fields = [];
    const values = [];

    if (name !== undefined)           { fields.push('name = ?');           values.push(name); }
    if (bio !== undefined)            { fields.push('bio = ?');            values.push(bio); }
    if (profilePicture !== undefined) { fields.push('profilePicture = ?'); values.push(profilePicture); }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'Nothing to update.' });
    }

    values.push(studentId);

    await pool.query(
      `UPDATE Student SET ${fields.join(', ')} WHERE studentId = ?`,
      values
    );

    // Return fresh data
    const [rows] = await pool.query(
      `SELECT studentId, rollNumber, email, name, bio, profilePicture,
              workerRating, giverRating, totalVouchCount, verifiedReviewer
       FROM Student WHERE studentId = ?`,
      [studentId]
    );

    res.json({ success: true, message: 'Profile updated.', student: rows[0] });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/students/me
 * Soft-delete the logged-in student's account.
 * We NEVER hard-delete — it would break FK references in reviews, jobs, etc.
 */
async function deleteMyAccount(req, res, next) {
  try {
    const studentId = req.user.studentId;

    await pool.query(
      `UPDATE Student SET deletedAt = NOW() WHERE studentId = ? AND deletedAt IS NULL`,
      [studentId]
    );

    res.json({ success: true, message: 'Account deactivated successfully.' });
  } catch (err) {
    next(err);
  }
}

// ─── Student Skills ───────────────────────────────────────────────────────────

/**
 * GET /api/students/me/skills
 */
async function getMySkills(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT ss.studentSkillId, s.skillId, s.skillName, s.category,
              ss.proficiencyLevel, ss.relevantComp, ss.addedAt
       FROM StudentSkill ss
       JOIN Skill s ON s.skillId = ss.skillId
       WHERE ss.studentId = ?
       ORDER BY s.skillName`,
      [req.user.studentId]
    );

    res.json({ success: true, skills: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/students/me/skills
 * Add a skill to own profile.
 * Body: { skillId, proficiencyLevel? }
 */
async function addSkill(req, res, next) {
  try {
    const studentId = req.user.studentId;
    const { skillId, proficiencyLevel = 'BEGINNER' } = req.body;

    if (!skillId) {
      return res.status(400).json({ success: false, message: 'skillId is required.' });
    }

    const validLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
    if (!validLevels.includes(proficiencyLevel)) {
      return res.status(400).json({
        success: false,
        message: `proficiencyLevel must be one of: ${validLevels.join(', ')}`,
      });
    }

    // Verify skill exists
    const [skill] = await pool.query('SELECT skillId FROM Skill WHERE skillId = ?', [skillId]);
    if (skill.length === 0) {
      return res.status(404).json({ success: false, message: 'Skill not found in catalogue.' });
    }

    // INSERT or UPDATE if already added (student might want to upgrade proficiency)
    await pool.query(
      `INSERT INTO StudentSkill (studentId, skillId, proficiencyLevel)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE proficiencyLevel = VALUES(proficiencyLevel)`,
      [studentId, skillId, proficiencyLevel]
    );

    res.status(201).json({ success: true, message: 'Skill added to profile.' });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/students/me/skills/:skillId
 * Update proficiency level of an existing skill on own profile.
 */
async function updateSkill(req, res, next) {
  try {
    const studentId      = req.user.studentId;
    const { skillId }    = req.params;
    const { proficiencyLevel } = req.body;

    const validLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
    if (!proficiencyLevel || !validLevels.includes(proficiencyLevel)) {
      return res.status(400).json({
        success: false,
        message: `proficiencyLevel must be one of: ${validLevels.join(', ')}`,
      });
    }

    const [result] = await pool.query(
      `UPDATE StudentSkill
       SET proficiencyLevel = ?
       WHERE studentId = ? AND skillId = ?`,
      [proficiencyLevel, studentId, skillId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Skill not found on your profile.' });
    }

    res.json({ success: true, message: 'Proficiency level updated.' });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/students/me/skills/:skillId
 * Remove a skill from own profile.
 */
async function removeSkill(req, res, next) {
  try {
    const studentId   = req.user.studentId;
    const { skillId } = req.params;

    const [result] = await pool.query(
      `DELETE FROM StudentSkill WHERE studentId = ? AND skillId = ?`,
      [studentId, skillId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Skill not on your profile.' });
    }

    res.json({ success: true, message: 'Skill removed.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getStudentById,
  listStudents,
  updateMyProfile,
  deleteMyAccount,
  getMySkills,
  addSkill,
  updateSkill,
  removeSkill,
};

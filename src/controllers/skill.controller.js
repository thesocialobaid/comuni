/**
 * skill.controller.js — Global Skill Catalogue
 *
 * Skills live in a central Skill table so every student and every job
 * reference the SAME canonical skill record.  This is the 3NF design
 * your schema uses — skills are not duplicated as strings per student.
 *
 * Typically an admin seeds this table, but for the project we allow
 * any logged-in student to suggest new skills.
 */

const { pool } = require('../config/db');

/**
 * GET /api/skills
 * List all skills. Supports ?category= and ?search= filters.
 */
async function listSkills(req, res, next) {
  try {
    const { category, search } = req.query;

    let query  = 'SELECT skillId, skillName, category FROM Skill WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND skillName LIKE ?';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY skillName';

    const [rows] = await pool.query(query, params);
    res.json({ success: true, count: rows.length, skills: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/skills/:skillId
 */
async function getSkillById(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT skillId, skillName, category FROM Skill WHERE skillId = ?',
      [req.params.skillId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Skill not found.' });
    }

    res.json({ success: true, skill: rows[0] });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/skills
 * Create a new skill in the catalogue.
 * Body: { skillName, category? }
 */
async function createSkill(req, res, next) {
  try {
    const { skillName, category } = req.body;

    if (!skillName || skillName.trim() === '') {
      return res.status(400).json({ success: false, message: 'skillName is required.' });
    }

    const [result] = await pool.query(
      'INSERT INTO Skill (skillName, category) VALUES (?, ?)',
      [skillName.trim(), category || null]
    );

    res.status(201).json({
      success: true,
      message: 'Skill created.',
      skill: { skillId: result.insertId, skillName, category },
    });
  } catch (err) {
    // MySQL unique constraint on skillName
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Skill already exists.' });
    }
    next(err);
  }
}

/**
 * GET /api/skills/categories
 * Return distinct categories for frontend dropdown.
 */
async function listCategories(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT DISTINCT category FROM Skill WHERE category IS NOT NULL ORDER BY category'
    );

    res.json({ success: true, categories: rows.map(r => r.category) });
  } catch (err) {
    next(err);
  }
}

module.exports = { listSkills, getSkillById, createSkill, listCategories };



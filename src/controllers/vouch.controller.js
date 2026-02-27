/**
 * vouch.controller.js — Peer Trust Vouching System
 *
 * Only students with verifiedReviewer = TRUE (completed >= 3 jobs) can vouch.
 * A vouch can be general (no skillId) or skill-specific.
 *
 * POST   /api/vouches              → Give a vouch
 * GET    /api/students/:studentId/vouches → See vouches received by a student
 * DELETE /api/vouches/:vouchId     → Retract a vouch you gave
 */

const { pool } = require('../config/db');

// ─── Give Vouch ───────────────────────────────────────────────────────────────

/**
 * POST /api/vouches
 * Body: { voucheeId, skillId?, comment? }
 *
 * Guards:
 *  - Cannot vouch for yourself
 *  - Voucher must be a verifiedReviewer
 *  - Cannot vouch same person for same skill twice (UNIQUE constraint)
 */
async function giveVouch(req, res, next) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const voucherId = req.user.studentId;
    const { voucheeId, skillId = null, comment } = req.body;

    if (!voucheeId) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'voucheeId is required.' });
    }

    if (voucherId === parseInt(voucheeId)) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'You cannot vouch for yourself.' });
    }

    // Check voucher is verified
    const [voucher] = await conn.query(
      'SELECT verifiedReviewer FROM Student WHERE studentId = ? AND deletedAt IS NULL',
      [voucherId]
    );

    if (voucher.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Your account was not found.' });
    }

    if (!voucher[0].verifiedReviewer) {
      await conn.rollback();
      return res.status(403).json({
        success: false,
        message: 'Only verified students (3+ completed jobs) can give vouches.',
      });
    }

    // Check vouchee exists
    const [vouchee] = await conn.query(
      'SELECT studentId FROM Student WHERE studentId = ? AND deletedAt IS NULL',
      [voucheeId]
    );

    if (vouchee.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Vouchee not found.' });
    }

    // Insert vouch
    const [result] = await conn.query(
      `INSERT INTO Vouch (voucherId, voucheeId, skillId, comment)
       VALUES (?, ?, ?, ?)`,
      [voucherId, voucheeId, skillId || null, comment || null]
    );

    // Increment vouchee's total vouch count
    await conn.query(
      'UPDATE Student SET totalVouchCount = totalVouchCount + 1 WHERE studentId = ?',
      [voucheeId]
    );

    // If skill-specific vouch, increment relevantComp on that StudentSkill row
    if (skillId) {
      await conn.query(
        `UPDATE StudentSkill
         SET relevantComp = relevantComp + 1
         WHERE studentId = ? AND skillId = ?`,
        [voucheeId, skillId]
      );
    }

    await conn.commit();

    res.status(201).json({
      success: true,
      message: 'Vouch submitted.',
      vouchId: result.insertId,
    });
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'You have already vouched for this person for this skill.',
      });
    }
    next(err);
  } finally {
    conn.release();
  }
}

// ─── Get Vouches Received ─────────────────────────────────────────────────────

/**
 * GET /api/students/:studentId/vouches
 * Returns all vouches a student has received, optionally filtered by skillId.
 */
async function getStudentVouches(req, res, next) {
  try {
    const { studentId } = req.params;
    const { skillId }   = req.query;

    let query = `
      SELECT v.vouchId, v.comment, v.createdAt,
             voucher.name AS voucherName, voucher.studentId AS voucherId,
             sk.skillName, sk.skillId
      FROM Vouch v
      JOIN Student voucher ON voucher.studentId = v.voucherId
      LEFT JOIN Skill sk ON sk.skillId = v.skillId
      WHERE v.voucheeId = ?
    `;
    const params = [studentId];

    if (skillId) {
      query += ' AND v.skillId = ?';
      params.push(skillId);
    }

    query += ' ORDER BY v.createdAt DESC';

    const [rows] = await pool.query(query, params);

    res.json({ success: true, count: rows.length, vouches: rows });
  } catch (err) {
    next(err);
  }
}

// ─── Retract Vouch ─────────────────────────────────────────────────────────────

/**
 * DELETE /api/vouches/:vouchId
 * Only the voucher can retract their own vouch.
 */
async function retractVouch(req, res, next) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { vouchId } = req.params;
    const voucherId   = req.user.studentId;

    const [vouches] = await conn.query(
      'SELECT vouchId, voucheeId, skillId FROM Vouch WHERE vouchId = ? AND voucherId = ?',
      [vouchId, voucherId]
    );

    if (vouches.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Vouch not found or not yours to retract.' });
    }

    const vouch = vouches[0];

    await conn.query('DELETE FROM Vouch WHERE vouchId = ?', [vouchId]);

    // Decrement counters
    await conn.query(
      'UPDATE Student SET totalVouchCount = GREATEST(totalVouchCount - 1, 0) WHERE studentId = ?',
      [vouch.voucheeId]
    );

    if (vouch.skillId) {
      await conn.query(
        `UPDATE StudentSkill
         SET relevantComp = GREATEST(relevantComp - 1, 0)
         WHERE studentId = ? AND skillId = ?`,
        [vouch.voucheeId, vouch.skillId]
      );
    }

    await conn.commit();

    res.json({ success: true, message: 'Vouch retracted.' });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

/**
 * GET /api/vouches/mine
 * Vouches the current user has given.
 */
async function getMyGivenVouches(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT v.vouchId, v.comment, v.createdAt,
              vouchee.name AS voucheeName, vouchee.studentId AS voucheeId,
              sk.skillName
       FROM Vouch v
       JOIN Student vouchee ON vouchee.studentId = v.voucheeId
       LEFT JOIN Skill sk ON sk.skillId = v.skillId
       WHERE v.voucherId = ?
       ORDER BY v.createdAt DESC`,
      [req.user.studentId]
    );

    res.json({ success: true, vouches: rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { giveVouch, getStudentVouches, retractVouch, getMyGivenVouches };



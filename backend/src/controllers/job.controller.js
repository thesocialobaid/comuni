/**
 * job.controller.js — Job Lifecycle Management
 *
 * Covers the full lifecycle:
 *  POST   /api/jobs              → Create job
 *  GET    /api/jobs              → Browse / search jobs
 *  GET    /api/jobs/:jobId       → Job detail with required skills
 *  PATCH  /api/jobs/:jobId       → Update job (only poster, only if OPEN)
 *  DELETE /api/jobs/:jobId       → Cancel job
 *  POST   /api/jobs/:jobId/skills       → Add required skill to job
 *  DELETE /api/jobs/:jobId/skills/:skillId → Remove required skill
 *  PATCH  /api/jobs/:jobId/complete     → Mark job as completed
 */

const { pool } = require('../config/db');

// ─── Helper ───────────────────────────────────────────────────────────────────

function requireOwnership(job, studentId) {
  if (job.postedBy !== studentId) {
    const err  = new Error('You are not the owner of this job.');
    err.statusCode = 403;
    throw err;
  }
}

// ─── Create Job ───────────────────────────────────────────────────────────────

/**
 * POST /api/jobs
 * Body: { title, description?, budget?, deadline?, urgent?, skills? }
 * skills = [{ skillId, isMandatory?, minProficiencyLevel? }]
 */
async function createJob(req, res, next) {
  const conn = await pool.getConnection(); // use transaction for job + skills
  try {
    await conn.beginTransaction();

    const {
      title,
      description,
      budget,
      deadline,
      urgent    = false,
      skills    = [],        // optional array of required skills
    } = req.body;

    const postedBy = req.user.studentId;

    if (!title || title.trim() === '') {
      return res.status(400).json({ success: false, message: 'title is required.' });
    }

    // Insert the job
    const [result] = await conn.query(
      `INSERT INTO Job (postedBy, title, description, budget, deadline, urgent)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [postedBy, title.trim(), description || null, budget || null, deadline || null, urgent]
    );

    const jobId = result.insertId;

    // Increment the poster's jobsPostedCount
    await conn.query(
      'UPDATE Student SET jobsPostedCount = jobsPostedCount + 1 WHERE studentId = ?',
      [postedBy]
    );

    // Insert required skills if provided
    if (skills.length > 0) {
      const skillRows = skills.map(s => [
        jobId,
        s.skillId,
        s.isMandatory            !== undefined ? s.isMandatory            : true,
        s.minProficiencyLevel    || 'BEGINNER',
      ]);

      await conn.query(
        `INSERT INTO JobSkill (jobId, skillId, isMandatory, minProficiencyLevel)
         VALUES ?`,
        [skillRows]
      );
    }

    await conn.commit();

    res.status(201).json({
      success: true,
      message: 'Job posted successfully.',
      jobId,
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

// ─── List / Search Jobs ───────────────────────────────────────────────────────

/**
 * GET /api/jobs
 * Query params: status, urgent, search (title), skillId, sortBy
 */
async function listJobs(req, res, next) {
  try {
    const {
      status,
      urgent,
      search,
      skillId,
      sortBy = 'newest',       // newest | deadline | budget
    } = req.query;

    let query = `
      SELECT j.jobId, j.title, j.description, j.budget, j.deadline,
             j.urgent, j.status, j.createdAt,
             s.name AS posterName, s.studentId AS postedBy,
             s.workerRating AS posterRating
      FROM Job j
      JOIN Student s ON s.studentId = j.postedBy
      WHERE s.deletedAt IS NULL
    `;
    const params = [];

    if (status) {
      query += ' AND j.status = ?';
      params.push(status);
    } else {
      // Default: only show open jobs on browse
      query += " AND j.status = 'OPEN'";
    }

    if (urgent !== undefined) {
      query += ' AND j.urgent = ?';
      params.push(urgent === 'true' ? 1 : 0);
    }

    if (search) {
      query += ' AND (j.title LIKE ? OR j.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Filter by required skill
    if (skillId) {
      query += ' AND j.jobId IN (SELECT jobId FROM JobSkill WHERE skillId = ?)';
      params.push(skillId);
    }

    const sortMap = {
      newest:   'j.createdAt DESC',
      deadline: 'j.deadline ASC',
      budget:   'j.budget DESC',
    };
    query += ` ORDER BY ${sortMap[sortBy] || 'j.createdAt DESC'}`;
    query += ' LIMIT 100';

    const [rows] = await pool.query(query, params);

    res.json({ success: true, count: rows.length, jobs: rows });
  } catch (err) {
    next(err);
  }
}

// ─── Get Single Job ───────────────────────────────────────────────────────────

/**
 * GET /api/jobs/:jobId
 * Returns full job detail including required skills and applicant count.
 */
async function getJobById(req, res, next) {
  try {
    const { jobId } = req.params;

    // Job details
    const [jobs] = await pool.query(
      `SELECT j.*,
              poster.name AS posterName, poster.rollNumber AS posterRollNumber,
              poster.workerRating AS posterRating,
              worker.name AS workerName
       FROM Job j
       JOIN Student poster ON poster.studentId = j.postedBy
       LEFT JOIN Student worker ON worker.studentId = j.assignedTo
       WHERE j.jobId = ?`,
      [jobId]
    );

    if (jobs.length === 0) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    // Required skills
    const [skills] = await pool.query(
      `SELECT js.jobSkillId, s.skillId, s.skillName, s.category,
              js.isMandatory, js.minProficiencyLevel
       FROM JobSkill js
       JOIN Skill s ON s.skillId = js.skillId
       WHERE js.jobId = ?`,
      [jobId]
    );

    // Applicant count (useful to show on job card without exposing identities)
    const [countRow] = await pool.query(
      `SELECT COUNT(*) AS applicantCount
       FROM JobApplication
       WHERE jobId = ? AND status != 'WITHDRAWN'`,
      [jobId]
    );

    res.json({
      success: true,
      job: {
        ...jobs[0],
        requiredSkills: skills,
        applicantCount: countRow[0].applicantCount,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Update Job ───────────────────────────────────────────────────────────────

/**
 * PATCH /api/jobs/:jobId
 * Only the poster can update, and only while status = 'OPEN'.
 * Body: { title?, description?, budget?, deadline?, urgent? }
 */
async function updateJob(req, res, next) {
  try {
    const { jobId } = req.params;

    const [jobs] = await pool.query(
      'SELECT jobId, postedBy, status FROM Job WHERE jobId = ?',
      [jobId]
    );
    if (jobs.length === 0) return res.status(404).json({ success: false, message: 'Job not found.' });

    requireOwnership(jobs[0], req.user.studentId);

    if (jobs[0].status !== 'OPEN') {
      return res.status(400).json({
        success: false,
        message: 'Only OPEN jobs can be edited.',
      });
    }

    const { title, description, budget, deadline, urgent } = req.body;
    const fields = [];
    const values = [];

    if (title       !== undefined) { fields.push('title = ?');       values.push(title); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (budget      !== undefined) { fields.push('budget = ?');      values.push(budget); }
    if (deadline    !== undefined) { fields.push('deadline = ?');    values.push(deadline); }
    if (urgent      !== undefined) { fields.push('urgent = ?');      values.push(urgent); }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'Nothing to update.' });
    }

    values.push(jobId);
    await pool.query(`UPDATE Job SET ${fields.join(', ')} WHERE jobId = ?`, values);

    res.json({ success: true, message: 'Job updated.' });
  } catch (err) {
    next(err);
  }
}

// ─── Cancel Job ───────────────────────────────────────────────────────────────

/**
 * DELETE /api/jobs/:jobId
 * Sets status = CANCELLED. Body: { cancellationReason? }
 */
async function cancelJob(req, res, next) {
  try {
    const { jobId } = req.params;

    const [jobs] = await pool.query(
      'SELECT jobId, postedBy, status FROM Job WHERE jobId = ?',
      [jobId]
    );
    if (jobs.length === 0) return res.status(404).json({ success: false, message: 'Job not found.' });

    requireOwnership(jobs[0], req.user.studentId);

    if (['COMPLETED', 'CANCELLED'].includes(jobs[0].status)) {
      return res.status(400).json({ success: false, message: 'Job is already closed.' });
    }

    const { cancellationReason } = req.body;

    await pool.query(
      `UPDATE Job
       SET status = 'CANCELLED', cancellationReason = ?, cancelledAt = NOW()
       WHERE jobId = ?`,
      [cancellationReason || null, jobId]
    );

    res.json({ success: true, message: 'Job cancelled.' });
  } catch (err) {
    next(err);
  }
}

// ─── Job Skill Management ─────────────────────────────────────────────────────

/**
 * POST /api/jobs/:jobId/skills
 * Add a required skill to a job.
 * Body: { skillId, isMandatory?, minProficiencyLevel? }
 */
async function addJobSkill(req, res, next) {
  try {
    const { jobId } = req.params;
    const { skillId, isMandatory = true, minProficiencyLevel = 'BEGINNER' } = req.body;

    if (!skillId) return res.status(400).json({ success: false, message: 'skillId is required.' });

    // Verify ownership
    const [jobs] = await pool.query('SELECT postedBy, status FROM Job WHERE jobId = ?', [jobId]);
    if (jobs.length === 0) return res.status(404).json({ success: false, message: 'Job not found.' });
    requireOwnership(jobs[0], req.user.studentId);

    if (jobs[0].status !== 'OPEN') {
      return res.status(400).json({ success: false, message: 'Cannot modify skills on a non-OPEN job.' });
    }

    await pool.query(
      `INSERT INTO JobSkill (jobId, skillId, isMandatory, minProficiencyLevel)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE isMandatory = VALUES(isMandatory),
                               minProficiencyLevel = VALUES(minProficiencyLevel)`,
      [jobId, skillId, isMandatory, minProficiencyLevel]
    );

    res.status(201).json({ success: true, message: 'Skill requirement added.' });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/jobs/:jobId/skills/:skillId
 */
async function removeJobSkill(req, res, next) {
  try {
    const { jobId, skillId } = req.params;

    const [jobs] = await pool.query('SELECT postedBy FROM Job WHERE jobId = ?', [jobId]);
    if (jobs.length === 0) return res.status(404).json({ success: false, message: 'Job not found.' });
    requireOwnership(jobs[0], req.user.studentId);

    await pool.query('DELETE FROM JobSkill WHERE jobId = ? AND skillId = ?', [jobId, skillId]);

    res.json({ success: true, message: 'Skill requirement removed.' });
  } catch (err) {
    next(err);
  }
}

// ─── Complete Job ─────────────────────────────────────────────────────────────

/**
 * PATCH /api/jobs/:jobId/complete
 * Poster marks the job as completed after the worker has delivered.
 * This triggers stat updates (jobsCompletedCount, verifiedReviewer).
 */
async function completeJob(req, res, next) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { jobId } = req.params;

    const [jobs] = await conn.query(
      'SELECT jobId, postedBy, assignedTo, status FROM Job WHERE jobId = ?',
      [jobId]
    );

    if (jobs.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    const job = jobs[0];
    requireOwnership(job, req.user.studentId);

    if (job.status !== 'IN_PROGRESS') {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: 'Job must be IN_PROGRESS to mark as completed.',
      });
    }

    if (!job.assignedTo) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: 'No worker is assigned to this job.',
      });
    }

    // Mark job complete
    await conn.query(
      `UPDATE Job SET status = 'COMPLETED', completedAt = NOW() WHERE jobId = ?`,
      [jobId]
    );

    // Increment worker's completed jobs count
    await conn.query(
      'UPDATE Student SET jobsCompletedCount = jobsCompletedCount + 1 WHERE studentId = ?',
      [job.assignedTo]
    );

    // Grant verifiedReviewer status if worker has completed >= 3 jobs
    await conn.query(
      `UPDATE Student
       SET verifiedReviewer = TRUE
       WHERE studentId = ? AND jobsCompletedCount >= 3`,
      [job.assignedTo]
    );

    await conn.commit();

    res.json({ success: true, message: 'Job marked as completed.' });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

/**
 * GET /api/jobs/mine
 * Jobs posted by the currently logged-in student.
 */
async function getMyJobs(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT j.jobId, j.title, j.status, j.budget, j.deadline, j.urgent,
              j.createdAt, j.completedAt,
              w.name AS workerName,
              (SELECT COUNT(*) FROM JobApplication a WHERE a.jobId = j.jobId AND a.status != 'WITHDRAWN') AS applicantCount
       FROM Job j
       LEFT JOIN Student w ON w.studentId = j.assignedTo
       WHERE j.postedBy = ?
       ORDER BY j.createdAt DESC`,
      [req.user.studentId]
    );

    res.json({ success: true, jobs: rows });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createJob,
  listJobs,
  getJobById,
  updateJob,
  cancelJob,
  addJobSkill,
  removeJobSkill,
  completeJob,
  getMyJobs,
};
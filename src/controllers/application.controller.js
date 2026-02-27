/**
 * application.controller.js — Job Application Lifecycle
 *
 * POST   /api/jobs/:jobId/apply            → Student applies
 * GET    /api/jobs/:jobId/applications     → Poster sees ranked applicant list
 * PATCH  /api/jobs/:jobId/applications/:applicationId/accept  → Poster accepts
 * PATCH  /api/jobs/:jobId/applications/:applicationId/reject  → Poster rejects
 * DELETE /api/jobs/:jobId/applications/:applicationId         → Applicant withdraws
 * GET    /api/applications/mine            → My own applications
 */

const { pool }          = require('../config/db');
const { rankApplicants } = require('../services/ranking.service');

// ─── Apply ────────────────────────────────────────────────────────────────────

/**
 * POST /api/jobs/:jobId/apply
 * The calling student applies to a job.
 * Guard: cannot apply to own job, cannot apply if already applied.
 */
async function applyToJob(req, res, next) {
  try {
    const { jobId }     = req.params;
    const applicantId   = req.user.studentId;

    // Fetch job
    const [jobs] = await pool.query(
      'SELECT jobId, postedBy, status FROM Job WHERE jobId = ?',
      [jobId]
    );

    if (jobs.length === 0) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    const job = jobs[0];

    if (job.postedBy === applicantId) {
      return res.status(400).json({ success: false, message: 'You cannot apply to your own job.' });
    }

    if (job.status !== 'OPEN') {
      return res.status(400).json({ success: false, message: 'This job is not accepting applications.' });
    }

    // Check for duplicate
    const [existing] = await pool.query(
      'SELECT applicationId, status FROM JobApplication WHERE jobId = ? AND applicantId = ?',
      [jobId, applicantId]
    );

    if (existing.length > 0 && existing[0].status !== 'WITHDRAWN') {
      return res.status(409).json({
        success: false,
        message: 'You have already applied to this job.',
      });
    }

    // If previously WITHDRAWN, re-open the application
    if (existing.length > 0 && existing[0].status === 'WITHDRAWN') {
      await pool.query(
        `UPDATE JobApplication
         SET status = 'PENDING', rankScore = NULL, resolvedAt = NULL, appliedAt = NOW()
         WHERE applicationId = ?`,
        [existing[0].applicationId]
      );

      return res.status(200).json({
        success: true,
        message: 'Application re-submitted.',
        applicationId: existing[0].applicationId,
      });
    }

    // Fresh application
    const [result] = await pool.query(
      'INSERT INTO JobApplication (jobId, applicantId) VALUES (?, ?)',
      [jobId, applicantId]
    );

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully.',
      applicationId: result.insertId,
    });
  } catch (err) {
    next(err);
  }
}

// ─── Get Ranked Applications ──────────────────────────────────────────────────

/**
 * GET /api/jobs/:jobId/applications
 * Only the job poster can see applications.
 * Triggers the ranking engine and returns a sorted list.
 */
async function getApplications(req, res, next) {
  try {
    const { jobId }  = req.params;
    const studentId  = req.user.studentId;

    const [jobs] = await pool.query(
      'SELECT jobId, postedBy FROM Job WHERE jobId = ?',
      [jobId]
    );

    if (jobs.length === 0) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    if (jobs[0].postedBy !== studentId) {
      return res.status(403).json({ success: false, message: 'Only the job poster can view applications.' });
    }

    // Run ranking engine — scores are saved back to DB
    const rankedApplicants = await rankApplicants(parseInt(jobId));

    // Also fetch ACCEPTED / REJECTED ones so poster has full picture
    const [resolved] = await pool.query(
      `SELECT ja.applicationId, ja.applicantId, ja.status, ja.rankScore, ja.appliedAt,
              s.name, s.workerRating, s.totalVouchCount, s.verifiedReviewer
       FROM JobApplication ja
       JOIN Student s ON s.studentId = ja.applicantId
       WHERE ja.jobId = ? AND ja.status IN ('ACCEPTED', 'REJECTED')`,
      [jobId]
    );

    res.json({
      success: true,
      jobId: parseInt(jobId),
      ranked: rankedApplicants,        // scored + sorted PENDING applicants
      resolved,                         // already-decided applications
    });
  } catch (err) {
    next(err);
  }
}

// ─── Accept Application ───────────────────────────────────────────────────────

/**
 * PATCH /api/jobs/:jobId/applications/:applicationId/accept
 *
 * - Marks application as ACCEPTED
 * - Sets job.assignedTo and job.status = IN_PROGRESS
 * - Rejects all other pending applications automatically
 */
async function acceptApplication(req, res, next) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { jobId, applicationId } = req.params;
    const studentId = req.user.studentId;

    // Ownership check
    const [jobs] = await conn.query(
      'SELECT jobId, postedBy, status FROM Job WHERE jobId = ?',
      [jobId]
    );

    if (jobs.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    if (jobs[0].postedBy !== studentId) {
      await conn.rollback();
      return res.status(403).json({ success: false, message: 'Only the job poster can accept applications.' });
    }

    if (jobs[0].status !== 'OPEN') {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Job is no longer open for acceptance.' });
    }

    // Fetch the application
    const [apps] = await conn.query(
      'SELECT applicationId, applicantId, status FROM JobApplication WHERE applicationId = ? AND jobId = ?',
      [applicationId, jobId]
    );

    if (apps.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (apps[0].status !== 'PENDING') {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Can only accept PENDING applications.' });
    }

    const workerId = apps[0].applicantId;

    // Accept this application
    await conn.query(
      `UPDATE JobApplication
       SET status = 'ACCEPTED', resolvedAt = NOW()
       WHERE applicationId = ?`,
      [applicationId]
    );

    // Auto-reject all other pending applications for this job
    await conn.query(
      `UPDATE JobApplication
       SET status = 'REJECTED', resolvedAt = NOW()
       WHERE jobId = ? AND applicationId != ? AND status = 'PENDING'`,
      [jobId, applicationId]
    );

    // Assign worker to job and move to IN_PROGRESS
    await conn.query(
      `UPDATE Job SET assignedTo = ?, status = 'IN_PROGRESS' WHERE jobId = ?`,
      [workerId, jobId]
    );

    await conn.commit();

    res.json({
      success: true,
      message: 'Application accepted. Job is now IN_PROGRESS.',
      workerId,
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

// ─── Reject Application ───────────────────────────────────────────────────────

/**
 * PATCH /api/jobs/:jobId/applications/:applicationId/reject
 */
async function rejectApplication(req, res, next) {
  try {
    const { jobId, applicationId } = req.params;
    const studentId = req.user.studentId;

    const [jobs] = await pool.query('SELECT postedBy FROM Job WHERE jobId = ?', [jobId]);
    if (jobs.length === 0) return res.status(404).json({ success: false, message: 'Job not found.' });
    if (jobs[0].postedBy !== studentId) {
      return res.status(403).json({ success: false, message: 'Only the job poster can reject applications.' });
    }

    const [result] = await pool.query(
      `UPDATE JobApplication
       SET status = 'REJECTED', resolvedAt = NOW()
       WHERE applicationId = ? AND jobId = ? AND status = 'PENDING'`,
      [applicationId, jobId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Pending application not found.' });
    }

    res.json({ success: true, message: 'Application rejected.' });
  } catch (err) {
    next(err);
  }
}

// ─── Withdraw Application ─────────────────────────────────────────────────────

/**
 * DELETE /api/jobs/:jobId/applications/:applicationId
 * Applicant withdraws their own application.
 */
async function withdrawApplication(req, res, next) {
  try {
    const { jobId, applicationId } = req.params;
    const studentId = req.user.studentId;

    const [result] = await pool.query(
      `UPDATE JobApplication
       SET status = 'WITHDRAWN', resolvedAt = NOW()
       WHERE applicationId = ? AND jobId = ? AND applicantId = ? AND status = 'PENDING'`,
      [applicationId, jobId, studentId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found or already resolved.',
      });
    }

    res.json({ success: true, message: 'Application withdrawn.' });
  } catch (err) {
    next(err);
  }
}

// ─── My Applications ──────────────────────────────────────────────────────────

/**
 * GET /api/applications/mine
 * Jobs the current user has applied to.
 */
async function getMyApplications(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT ja.applicationId, ja.status, ja.rankScore, ja.appliedAt, ja.resolvedAt,
              j.jobId, j.title, j.budget, j.deadline, j.status AS jobStatus, j.urgent,
              poster.name AS posterName
       FROM JobApplication ja
       JOIN Job j ON j.jobId = ja.jobId
       JOIN Student poster ON poster.studentId = j.postedBy
       WHERE ja.applicantId = ?
       ORDER BY ja.appliedAt DESC`,
      [req.user.studentId]
    );

    res.json({ success: true, applications: rows });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  applyToJob,
  getApplications,
  acceptApplication,
  rejectApplication,
  withdrawApplication,
  getMyApplications,
};
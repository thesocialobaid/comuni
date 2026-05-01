/**
 * application.service.js
 *
 * All business logic for the Job Application lifecycle.
 * Throws plain Error objects with a `.statusCode` property so the
 * controller (or a shared error-handler middleware) can map them to
 * the right HTTP response without any business logic leaking upward.
 */
 
const { pool }           = require('../config/db');
const { rankApplicants } = require('./ranking.service');
 
// ─── Helpers ──────────────────────────────────────────────────────────────────
 
function createError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}
 
// ─── Queries (private) ────────────────────────────────────────────────────────
 
async function fetchJob(jobId, conn = pool) {
  const [rows] = await conn.query(
    'SELECT jobId, postedBy, status FROM Job WHERE jobId = ?',
    [jobId]
  );
  return rows[0] ?? null;
}
 
async function fetchApplication(applicationId, jobId, conn = pool) {
  const [rows] = await conn.query(
    'SELECT applicationId, applicantId, status FROM JobApplication WHERE applicationId = ? AND jobId = ?',
    [applicationId, jobId]
  );
  return rows[0] ?? null;
}
 
async function fetchExistingApplication(jobId, applicantId) {
  const [rows] = await pool.query(
    'SELECT applicationId, status FROM JobApplication WHERE jobId = ? AND applicantId = ?',
    [jobId, applicantId]
  );
  return rows[0] ?? null;
}
 
// ─── applyToJob ───────────────────────────────────────────────────────────────
 
async function applyToJob(jobId, applicantId) {
  const job = await fetchJob(jobId);
 
  if (!job)                         throw createError(404, 'Job not found.');
  if (job.postedBy === applicantId) throw createError(400, 'You cannot apply to your own job.');
  if (job.status !== 'OPEN')        throw createError(400, 'This job is not accepting applications.');
 
  const existing = await fetchExistingApplication(jobId, applicantId);
 
  if (existing && existing.status !== 'WITHDRAWN') {
    throw createError(409, 'You have already applied to this job.');
  }
 
  if (existing && existing.status === 'WITHDRAWN') {
    await pool.query(
      `UPDATE JobApplication
       SET status = 'PENDING', rankScore = NULL, resolvedAt = NULL, appliedAt = NOW()
       WHERE applicationId = ?`,
      [existing.applicationId]
    );
    return { message: 'Application re-submitted.', applicationId: existing.applicationId, created: false };
  }
 
  const [result] = await pool.query(
    'INSERT INTO JobApplication (jobId, applicantId) VALUES (?, ?)',
    [jobId, applicantId]
  );
 
  return { message: 'Application submitted successfully.', applicationId: result.insertId, created: true };
}
 
// ─── getApplications ──────────────────────────────────────────────────────────
 
async function getApplications(jobId, requestingStudentId) {
  const job = await fetchJob(jobId);
 
  if (!job)                                         throw createError(404, 'Job not found.');
  if (job.postedBy !== requestingStudentId)         throw createError(403, 'Only the job poster can view applications.');
 
  const rankedApplicants = await rankApplicants(parseInt(jobId));
 
  const [resolved] = await pool.query(
    `SELECT ja.applicationId, ja.applicantId, ja.status, ja.rankScore, ja.appliedAt,
            s.name, s.workerRating, s.totalVouchCount, s.verifiedReviewer
     FROM JobApplication ja
     JOIN Student s ON s.studentId = ja.applicantId
     WHERE ja.jobId = ? AND ja.status IN ('ACCEPTED', 'REJECTED')`,
    [jobId]
  );
 
  return { jobId: parseInt(jobId), ranked: rankedApplicants, resolved };
}
 
// ─── acceptApplication ────────────────────────────────────────────────────────
 
async function acceptApplication(jobId, applicationId, requestingStudentId) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
 
    const job = await fetchJob(jobId, conn);
 
    if (!job)                                     throw createError(404, 'Job not found.');
    if (job.postedBy !== requestingStudentId)     throw createError(403, 'Only the job poster can accept applications.');
    if (job.status !== 'OPEN')                    throw createError(400, 'Job is no longer open for acceptance.');
 
    const application = await fetchApplication(applicationId, jobId, conn);
 
    if (!application)                             throw createError(404, 'Application not found.');
    if (application.status !== 'PENDING')         throw createError(400, 'Can only accept PENDING applications.');
 
    const workerId = application.applicantId;
 
    await conn.query(
      `UPDATE JobApplication SET status = 'ACCEPTED', resolvedAt = NOW() WHERE applicationId = ?`,
      [applicationId]
    );
 
    await conn.query(
      `UPDATE JobApplication
       SET status = 'REJECTED', resolvedAt = NOW()
       WHERE jobId = ? AND applicationId != ? AND status = 'PENDING'`,
      [jobId, applicationId]
    );
 
    await conn.query(
      `UPDATE Job SET assignedTo = ?, status = 'IN_PROGRESS' WHERE jobId = ?`,
      [workerId, jobId]
    );
 
    await conn.commit();
    return { message: 'Application accepted. Job is now IN_PROGRESS.', workerId };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
 
// ─── rejectApplication ────────────────────────────────────────────────────────
 
async function rejectApplication(jobId, applicationId, requestingStudentId) {
  const job = await fetchJob(jobId);
 
  if (!job)                                     throw createError(404, 'Job not found.');
  if (job.postedBy !== requestingStudentId)     throw createError(403, 'Only the job poster can reject applications.');
 
  const [result] = await pool.query(
    `UPDATE JobApplication
     SET status = 'REJECTED', resolvedAt = NOW()
     WHERE applicationId = ? AND jobId = ? AND status = 'PENDING'`,
    [applicationId, jobId]
  );
 
  if (result.affectedRows === 0) throw createError(404, 'Pending application not found.');
}
 
// ─── withdrawApplication ──────────────────────────────────────────────────────
 
async function withdrawApplication(jobId, applicationId, applicantId) {
  const [result] = await pool.query(
    `UPDATE JobApplication
     SET status = 'WITHDRAWN', resolvedAt = NOW()
     WHERE applicationId = ? AND jobId = ? AND applicantId = ? AND status = 'PENDING'`,
    [applicationId, jobId, applicantId]
  );
 
  if (result.affectedRows === 0) throw createError(404, 'Application not found or already resolved.');
}
 
// ─── getMyApplications ────────────────────────────────────────────────────────
 
async function getMyApplications(applicantId) {
  const [rows] = await pool.query(
    `SELECT ja.applicationId, ja.status, ja.rankScore, ja.appliedAt, ja.resolvedAt,
            j.jobId, j.title, j.budget, j.deadline, j.status AS jobStatus, j.urgent,
            poster.name AS posterName
     FROM JobApplication ja
     JOIN Job j ON j.jobId = ja.jobId
     JOIN Student poster ON poster.studentId = j.postedBy
     WHERE ja.applicantId = ?
     ORDER BY ja.appliedAt DESC`,
    [applicantId]
  );
 
  return rows;
}
 
module.exports = {
  applyToJob,
  getApplications,
  acceptApplication,
  rejectApplication,
  withdrawApplication,
  getMyApplications,
};
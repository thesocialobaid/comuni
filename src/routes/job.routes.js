/**
 * job.routes.js
 *
 * GET    /api/jobs              → Browse / search jobs
 * POST   /api/jobs              → Create a job
 * GET    /api/jobs/mine         → My posted jobs (BEFORE /:jobId)
 * GET    /api/jobs/:jobId       → Job detail
 * PATCH  /api/jobs/:jobId       → Update job
 * DELETE /api/jobs/:jobId       → Cancel job
 * PATCH  /api/jobs/:jobId/complete   → Mark completed
 *
 * POST   /api/jobs/:jobId/skills          → Add required skill
 * DELETE /api/jobs/:jobId/skills/:skillId → Remove required skill
 *
 * POST   /api/jobs/:jobId/apply                                → Apply
 * GET    /api/jobs/:jobId/applications                         → See applicants (ranked)
 * PATCH  /api/jobs/:jobId/applications/:applicationId/accept   → Accept
 * PATCH  /api/jobs/:jobId/applications/:applicationId/reject   → Reject
 * DELETE /api/jobs/:jobId/applications/:applicationId          → Withdraw
 *
 * POST   /api/jobs/:jobId/reviews   → Submit a review
 * GET    /api/jobs/:jobId/reviews   → Get reviews for a job
 */

const express     = require('express');
const router      = express.Router();
const jobCtrl     = require('../controllers/job.controller');
const appCtrl     = require('../controllers/application.controller');
const reviewCtrl  = require('../controllers/review.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// ── Jobs ──────────────────────────────────────────────────────────────────────
router.get('/',        jobCtrl.listJobs);
router.post('/',       jobCtrl.createJob);
router.get('/mine',    jobCtrl.getMyJobs);   // MUST come before /:jobId
router.get('/:jobId',  jobCtrl.getJobById);
router.patch('/:jobId', jobCtrl.updateJob);
router.delete('/:jobId', jobCtrl.cancelJob);
router.patch('/:jobId/complete', jobCtrl.completeJob);

// ── Job Skills ────────────────────────────────────────────────────────────────
router.post('/:jobId/skills',              jobCtrl.addJobSkill);
router.delete('/:jobId/skills/:skillId',   jobCtrl.removeJobSkill);

// ── Applications ──────────────────────────────────────────────────────────────
router.post('/:jobId/apply',                                        appCtrl.applyToJob);
router.get('/:jobId/applications',                                  appCtrl.getApplications);
router.patch('/:jobId/applications/:applicationId/accept',          appCtrl.acceptApplication);
router.patch('/:jobId/applications/:applicationId/reject',          appCtrl.rejectApplication);
router.delete('/:jobId/applications/:applicationId',                appCtrl.withdrawApplication);

// ── Reviews ───────────────────────────────────────────────────────────────────
router.post('/:jobId/reviews', reviewCtrl.submitReview);
router.get('/:jobId/reviews',  reviewCtrl.getJobReviews);

module.exports = router;
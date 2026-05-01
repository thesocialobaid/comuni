/**
 * application.controller.js — Job Application Lifecycle
 *
 * POST   /api/jobs/:jobId/apply                                  → Student applies
 * GET    /api/jobs/:jobId/applications                           → Poster sees ranked applicant list
 * PATCH  /api/jobs/:jobId/applications/:applicationId/accept     → Poster accepts
 * PATCH  /api/jobs/:jobId/applications/:applicationId/reject     → Poster rejects
 * DELETE /api/jobs/:jobId/applications/:applicationId            → Applicant withdraws
 * GET    /api/applications/mine                                  → My own applications
 */

const applicationService = require('../services/application.service');

async function applyToJob(req, res, next) {
  try {
    const result = await applicationService.applyToJob(req.params.jobId, req.user.studentId);
    res.status(result.created ? 201 : 200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function getApplications(req, res, next) {
  try {
    const result = await applicationService.getApplications(req.params.jobId, req.user.studentId);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function acceptApplication(req, res, next) {
  try {
    const { jobId, applicationId } = req.params;
    const result = await applicationService.acceptApplication(jobId, applicationId, req.user.studentId);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function rejectApplication(req, res, next) {
  try {
    const { jobId, applicationId } = req.params;
    await applicationService.rejectApplication(jobId, applicationId, req.user.studentId);
    res.json({ success: true, message: 'Application rejected.' });
  } catch (err) {
    next(err);
  }
}

async function withdrawApplication(req, res, next) {
  try {
    const { jobId, applicationId } = req.params;
    await applicationService.withdrawApplication(jobId, applicationId, req.user.studentId);
    res.json({ success: true, message: 'Application withdrawn.' });
  } catch (err) {
    next(err);
  }
}

async function getMyApplications(req, res, next) {
  try {
    const applications = await applicationService.getMyApplications(req.user.studentId);
    res.json({ success: true, applications });
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
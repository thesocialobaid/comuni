/**
 * student.routes.js
 *
 * GET    /api/students              → Browse all students
 * GET    /api/students/me/skills    → My skills (must come before /:studentId!)
 * GET    /api/students/:studentId   → Public profile
 * PATCH  /api/students/me           → Update my profile
 * DELETE /api/students/me           → Soft-delete my account
 *
 * POST   /api/students/me/skills        → Add skill to profile
 * PATCH  /api/students/me/skills/:skillId → Update proficiency
 * DELETE /api/students/me/skills/:skillId → Remove skill
 *
 * GET    /api/students/:studentId/reviews  → Defined in review.routes (cross-linked)
 * GET    /api/students/:studentId/vouches  → Defined in vouch.routes (cross-linked)
 */

const express    = require('express');
const router     = express.Router();
const studentCtrl = require('../controllers/student.controller');
const reviewCtrl  = require('../controllers/review.controller');
const vouchCtrl   = require('../controllers/vouch.controller');
const { authenticate } = require('../middleware/auth');

// All student routes require authentication
router.use(authenticate);

// ── Profile ──────────────────────────────────────────────────────────────────
router.get('/',               studentCtrl.listStudents);
router.get('/me/skills',      studentCtrl.getMySkills);    // BEFORE /:studentId
router.get('/:studentId',     studentCtrl.getStudentById);
router.patch('/me',           studentCtrl.updateMyProfile);
router.delete('/me',          studentCtrl.deleteMyAccount);

// ── Skills ────────────────────────────────────────────────────────────────────
router.post('/me/skills',               studentCtrl.addSkill);
router.patch('/me/skills/:skillId',     studentCtrl.updateSkill);
router.delete('/me/skills/:skillId',    studentCtrl.removeSkill);

// ── Reviews & Vouches on a student profile ────────────────────────────────────
router.get('/:studentId/reviews', reviewCtrl.getStudentReviews);
router.get('/:studentId/vouches', vouchCtrl.getStudentVouches);

module.exports = router;
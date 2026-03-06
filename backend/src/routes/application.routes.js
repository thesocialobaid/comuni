/**
 * application.routes.js
 *
 * Standalone route file for application-level endpoints that don't
 * live under a specific job (e.g., "all MY applications").
 *
 * GET /api/applications/mine
 */

const express = require('express');
const router = express.Router();
const appCtrl = require('../controllers/application.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/mine', appCtrl.getMyApplications);

module.exports = router; 
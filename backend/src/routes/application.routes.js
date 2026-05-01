/**
 * application.routes.js
 * GET /api/applications/mine
 */

const express = require('express');
const router = express.Router();
const appCtrl = require('../controllers/application.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/mine', appCtrl.getMyApplications);

module.exports = router; 
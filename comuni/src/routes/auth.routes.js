/**
 * auth.routes.js
 *
 * Public routes (no JWT needed):
 *   POST /api/auth/register
 *   POST /api/auth/login
 *
 * Protected route:
 *   GET  /api/auth/me   ← requires Bearer token
 */

const express     = require('express');
const router      = express.Router();
const authCtrl    = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { uploadProfilePicture } = require('../middleware/upload'); 

//Upload profile picture sits between the route and and the controller 
// Think of it as a security guard that handles the file BEFORE the controller 
    
router.post('/register',uploadProfilePicture, authCtrl.register);
router.post('/login',    authCtrl.login);
router.get('/me',        authenticate, authCtrl.getMe);

module.exports = router;

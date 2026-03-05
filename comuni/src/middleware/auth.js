/*
auth.js - Middleware for authentication and authorization
Any route that requires a logged-in user should use this middleware.
It reads the Bearer token from the Authorization header, verifies it, 
and attaches the decoded payload (e.g. user ID, role) to req.user for use in downstream controllers.

 Usage in a route file:
 *   const { authenticate } = require('../middleware/auth');
 *   router.get('/profile', authenticate, profileController.getMe);
 
*/

const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
    // The standard pattern is: Authorization: Bearer <token>
    const authHeader = req.headers['authorization'];

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
  }

   const token = authHeader.split(' ')[1]; // grab everything after "Bearer "

  try {
    // jwt.verify throws if the token is expired or tampered with
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach to req so every downstream controller can read studentId, etc.
    req.user = decoded; // { studentId, rollNumber, email, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.',
    });
  }
}

module.exports = { authenticate };

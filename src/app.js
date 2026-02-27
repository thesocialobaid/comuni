/**
 * app.js — CommuniTask Backend Entry Point
 *
 * This file:
 *  1. Creates the Express app
 *  2. Registers global middleware (CORS, JSON parsing)
 *  3. Mounts all route modules under /api/*
 *  4. Registers the global error handler at the end
 *  5. Starts the HTTP server
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * QUICK START:
 *   1. cp .env.example .env            ← copy and fill in your DB credentials
 *   2. npm install                     ← install dependencies
 *   3. mysql -u root -p < your_schema.sql  ← create the database tables
 *   4. npm run dev                     ← start with hot-reload via nodemon
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const path = require('path');

const express      = require('express');
const cors         = require('cors');

const { testConnection } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// ── Route modules ─────────────────────────────────────────────────────────────
const authRoutes        = require('./routes/auth.routes');
const studentRoutes     = require('./routes/student.routes');
const jobRoutes         = require('./routes/job.routes');
const skillRoutes       = require('./routes/skill.routes');
const applicationRoutes = require('./routes/application.routes');
const vouchRoutes       = require('./routes/vouch.routes');

// ─────────────────────────────────────────────────────────────────────────────

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Global Middleware ─────────────────────────────────────────────────────────

app.use(cors());          // Allow React frontend (any origin) to call the API
                          // In production, replace with: cors({ origin: 'https://your-frontend.com' })

app.use(express.json()); // Parse JSON request bodies (req.body)

// 25002500 Serve Uploaded Profile Pictures 250025002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500
// Profile pictures are accessible at: http://localhost:3000/uploads/profiles/filename.jpg
// The frontend uses the profilePicture string from the student object to display it.
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Health Check ──────────────────────────────────────────────────────────────
// Simple endpoint to verify the server is alive (useful for deployment checks)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'CommuniTask API',
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
// Order matters here — more specific prefixes first.

app.use('/api/auth',         authRoutes);           // /api/auth/register, /login, /me
app.use('/api/skills',       skillRoutes);           // /api/skills
app.use('/api/jobs',         jobRoutes);             // /api/jobs + nested applications/reviews
app.use('/api/students',     studentRoutes);         // /api/students + nested skills/reviews
app.use('/api/applications', applicationRoutes);     // /api/applications/mine
app.use('/api/vouches',      vouchRoutes);           // /api/vouches

// ── 404 Handler ───────────────────────────────────────────────────────────────
// If no route matched, return a clean 404 instead of Express's HTML error page
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
// MUST be last, after all routes. Express detects 4-arg middleware as error handler.
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
async function start() {
  await testConnection(); // verify DB before accepting traffic

  app.listen(PORT, () => {
    console.log(`\n🚀  CommuniTask API running on http://localhost:${PORT}`);
    console.log(`📋  API base: http://localhost:${PORT}/api`);
    console.log(`💚  Health:   http://localhost:${PORT}/health\n`);

    // Print full route map so team members know what endpoints exist
    console.log('── Available Endpoints ─────────────────────────────────');
    console.log('  AUTH');
    console.log('    POST   /api/auth/register');
    console.log('    POST   /api/auth/login');
    console.log('    GET    /api/auth/me');
    console.log('  STUDENTS');
    console.log('    GET    /api/students');
    console.log('    GET    /api/students/:studentId');
    console.log('    PATCH  /api/students/me');
    console.log('    DELETE /api/students/me');
    console.log('    GET    /api/students/me/skills');
    console.log('    POST   /api/students/me/skills');
    console.log('    PATCH  /api/students/me/skills/:skillId');
    console.log('    DELETE /api/students/me/skills/:skillId');
    console.log('    GET    /api/students/:studentId/reviews');
    console.log('    GET    /api/students/:studentId/vouches');
    console.log('  SKILLS');
    console.log('    GET    /api/skills');
    console.log('    GET    /api/skills/categories');
    console.log('    GET    /api/skills/:skillId');
    console.log('    POST   /api/skills');
    console.log('  JOBS');
    console.log('    GET    /api/jobs');
    console.log('    POST   /api/jobs');
    console.log('    GET    /api/jobs/mine');
    console.log('    GET    /api/jobs/:jobId');
    console.log('    PATCH  /api/jobs/:jobId');
    console.log('    DELETE /api/jobs/:jobId');
    console.log('    PATCH  /api/jobs/:jobId/complete');
    console.log('    POST   /api/jobs/:jobId/skills');
    console.log('    DELETE /api/jobs/:jobId/skills/:skillId');
    console.log('  APPLICATIONS');
    console.log('    GET    /api/applications/mine');
    console.log('    POST   /api/jobs/:jobId/apply');
    console.log('    GET    /api/jobs/:jobId/applications  ← ranked list');
    console.log('    PATCH  /api/jobs/:jobId/applications/:id/accept');
    console.log('    PATCH  /api/jobs/:jobId/applications/:id/reject');
    console.log('    DELETE /api/jobs/:jobId/applications/:id');
    console.log('  REVIEWS');
    console.log('    POST   /api/jobs/:jobId/reviews');
    console.log('    GET    /api/jobs/:jobId/reviews');
    console.log('  VOUCHES');
    console.log('    POST   /api/vouches');
    console.log('    GET    /api/vouches/mine');
    console.log('    DELETE /api/vouches/:vouchId');
    console.log('────────────────────────────────────────────────────────\n');
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
/**
 * review.controller.js — Post-Job Ratings & Reviews
 *
 * After a job is COMPLETED, both parties can review each other:
 *   - The poster reviews the worker (updates workerRating)
 *   - The worker reviews the poster (updates giverRating)
 *
 * POST  /api/jobs/:jobId/reviews   → Submit a review
 * GET   /api/jobs/:jobId/reviews   → Get reviews for a job
 * GET   /api/students/:studentId/reviews → All reviews received by a student
 */

const { pool } = require('../config/db');

// ─── Submit Review ─────────────────────────────────────────────────────────────

/**
 * POST /api/jobs/:jobId/reviews
 * Body: { rating (1-5), comment? }
 *
 * The system determines who is reviewer and who is reviewee automatically
 * based on who is calling (poster reviews worker, worker reviews poster).
 */
async function submitReview(req, res, next) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { jobId }    = req.params;
    const reviewerId   = req.user.studentId;
    const { rating, comment } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(Number(rating))) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5.',
      });
    }

    // Fetch job
    const [jobs] = await conn.query(
      'SELECT jobId, postedBy, assignedTo, status FROM Job WHERE jobId = ?',
      [jobId]
    );

    if (jobs.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    const job = jobs[0];

    if (job.status !== 'COMPLETED') {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Reviews can only be submitted for completed jobs.' });
    }

    // Determine who is reviewing whom
    let revieweeId;
    let isReviewingWorker; // true = poster reviewing worker

    if (reviewerId === job.postedBy) {
      revieweeId = job.assignedTo;
      isReviewingWorker = true;
    } else if (reviewerId === job.assignedTo) {
      revieweeId = job.postedBy;
      isReviewingWorker = false;
    } else {
      await conn.rollback();
      return res.status(403).json({
        success: false,
        message: 'You were not part of this job.',
      });
    }

    if (!revieweeId) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'No worker was assigned to this job.' });
    }

    // Insert review (UNIQUE constraint prevents duplicates)
    const [result] = await conn.query(
      `INSERT INTO Review (jobId, reviewerId, revieweeId, rating, comment)
       VALUES (?, ?, ?, ?, ?)`,
      [jobId, reviewerId, revieweeId, rating, comment || null]
    );

    // ── Update rolling average rating on the reviewee ─────────────────────────
    // We use the stored count + rating to compute a running average
    // without needing to re-aggregate all reviews every time.
    //
    // new_average = (old_average * old_count + new_rating) / (old_count + 1)
    //
    if (isReviewingWorker) {
      // Update workerRating (the worker is being reviewed)
      await conn.query(
        `UPDATE Student
         SET workerRating = ROUND(
               (workerRating * workerRatingCount + ?) / (workerRatingCount + 1), 2
             ),
             workerRatingCount = workerRatingCount + 1
         WHERE studentId = ?`,
        [rating, revieweeId]
      );
    } else {
      // Update giverRating (the poster is being reviewed)
      await conn.query(
        `UPDATE Student
         SET giverRating = ROUND(
               (giverRating * giverRatingCount + ?) / (giverRatingCount + 1), 2
             ),
             giverRatingCount = giverRatingCount + 1
         WHERE studentId = ?`,
        [rating, revieweeId]
      );
    }

    await conn.commit();

    res.status(201).json({
      success: true,
      message: 'Review submitted.',
      reviewId: result.insertId,
    });
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'You have already reviewed this job.',
      });
    }
    next(err);
  } finally {
    conn.release();
  }
}

// ─── Get Reviews for a Job ─────────────────────────────────────────────────────

/**
 * GET /api/jobs/:jobId/reviews
 */
async function getJobReviews(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT r.reviewId, r.rating, r.comment, r.createdAt,
              reviewer.name AS reviewerName, reviewer.studentId AS reviewerId,
              reviewee.name AS revieweeName, reviewee.studentId AS revieweeId
       FROM Review r
       JOIN Student reviewer ON reviewer.studentId = r.reviewerId
       JOIN Student reviewee ON reviewee.studentId = r.revieweeId
       WHERE r.jobId = ?`,
      [req.params.jobId]
    );

    res.json({ success: true, reviews: rows });
  } catch (err) {
    next(err);
  }
}

// ─── Get All Reviews Received by a Student ─────────────────────────────────────

/**
 * GET /api/students/:studentId/reviews
 */
async function getStudentReviews(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT r.reviewId, r.rating, r.comment, r.createdAt,
              reviewer.name AS reviewerName,
              j.title AS jobTitle, j.jobId
       FROM Review r
       JOIN Student reviewer ON reviewer.studentId = r.reviewerId
       JOIN Job j ON j.jobId = r.jobId
       WHERE r.revieweeId = ?
       ORDER BY r.createdAt DESC`,
      [req.params.studentId]
    );

    res.json({ success: true, count: rows.length, reviews: rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { submitReview, getJobReviews, getStudentReviews };



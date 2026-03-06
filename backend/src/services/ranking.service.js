/**
 * ranking.service.js — Weighted Ranking Engine (Level 3)
 *
 * This is the brain of CommuniTask.  It calculates a composite rank score
 * for each applicant on a given job using five weighted signals:
 *
 *   1. Skill Match Score   — How well the applicant's skills cover job requirements
 *   2. Verified Skills     — Extra credit for skills earned through completed jobs
 *   3. Completion Rate     — Reliability: (completed / posted) or just completed for freelancers
 *   4. Worker Rating       — Peer-assigned quality rating (1-5 scale)
 *   5. Vouch Count         — Trust from the peer community
 *
 * When a job is URGENT the Skill Match and Completion Rate weights increase
 * (we prioritize people who can deliver fast and match the brief exactly).
 *
 * The final score is normalized to 0–100 for easy display.
 */

const { pool } = require('../config/db');

// ─── Weight Profiles ──────────────────────────────────────────────────────────

const WEIGHTS_NORMAL = {
  skillMatch:      0.40,   // 40%
  verifiedSkills:  0.15,   // 15%
  completionRate:  0.20,   // 20%
  rating:          0.15,   // 15%
  vouchCount:      0.10,   // 10%
};

const WEIGHTS_URGENT = {
  skillMatch:      0.50,   // 50% — match matters most when deadline is tight
  verifiedSkills:  0.10,
  completionRate:  0.25,   // reliability is critical for urgent work
  rating:          0.10,
  vouchCount:      0.05,
};

// ─── Proficiency Levels → Numeric ─────────────────────────────────────────────

const PROFICIENCY_SCORE = {
  BEGINNER:     1,
  INTERMEDIATE: 2,
  ADVANCED:     3,
  EXPERT:       4,
};

// ─── Core Calculation ─────────────────────────────────────────────────────────

/**
 * calculateSkillMatchScore
 *
 * For each required job skill:
 *   - If the applicant has the skill AND meets the minimum level: full credit
 *   - If they have it but below minimum: partial credit (their level / min level)
 *   - If they don't have it at all:
 *       - mandatory skill → score 0, applicant is DISQUALIFIED
 *       - optional skill  → 0 credit for that skill
 *
 * Returns { score: 0–1, disqualified: bool }
 */
function calculateSkillMatchScore(jobSkills, applicantSkillMap) {
  if (jobSkills.length === 0) return { score: 1.0, disqualified: false }; // no requirements = full match

  let totalWeight    = 0;
  let earnedWeight   = 0;
  let disqualified   = false;

  for (const req of jobSkills) {
    // Mandatory skills are worth more in the skill match calculation
    const weight = req.isMandatory ? 2 : 1;
    totalWeight += weight;

    const applicantSkill = applicantSkillMap[req.skillId];

    if (!applicantSkill) {
      if (req.isMandatory) {
        disqualified = true; // hard disqualification
        return { score: 0, disqualified: true };
      }
      // Optional skill missing — 0 credit, continue
      continue;
    }

    const minScore = PROFICIENCY_SCORE[req.minProficiencyLevel] || 1;
    const hasScore = PROFICIENCY_SCORE[applicantSkill.proficiencyLevel] || 1;

    if (hasScore >= minScore) {
      earnedWeight += weight; // full credit
    } else {
      // Partial credit — at least they have the skill
      earnedWeight += weight * (hasScore / minScore);
    }
  }

  const score = totalWeight > 0 ? earnedWeight / totalWeight : 1;
  return { score, disqualified };
}

/**
 * normalizeRating — maps 1-5 rating to 0-1
 */
function normalizeRating(rating) {
  if (!rating || rating === 0) return 0;
  return (parseFloat(rating) - 1) / 4; // 1→0, 5→1
}

/**
 * normalizeVouch — logarithmic so 10 vouches isn't 10x better than 1
 * max useful cap at 20 vouches
 */
function normalizeVouch(count) {
  if (!count || count === 0) return 0;
  return Math.min(Math.log(count + 1) / Math.log(21), 1);
}

/**
 * normalizeCompletionRate — completedJobs / max(1, postedJobs)
 * For applicants (workers), we look at how many jobs they've completed total.
 * We cap at 10 completed jobs for normalization (10 = very experienced).
 */
function normalizeCompletionRate(completed, posted) {
  if (!completed) return 0;
  if (posted === 0) {
    // They haven't posted any jobs — base score on absolute completions
    return Math.min(completed / 10, 1);
  }
  return Math.min(completed / Math.max(posted, 1), 1);
}

// ─── Main Ranking Function ────────────────────────────────────────────────────

/**
 * rankApplicants(jobId)
 *
 * Fetches all PENDING applications for a job, scores each applicant,
 * updates their rankScore in JobApplication, and returns a sorted list.
 */
async function rankApplicants(jobId) {
  // 1. Get job info (urgent flag + required skills)
  const [jobRows] = await pool.query(
    `SELECT j.jobId, j.urgent,
            js.skillId, js.isMandatory, js.minProficiencyLevel
     FROM Job j
     LEFT JOIN JobSkill js ON js.jobId = j.jobId
     WHERE j.jobId = ?`,
    [jobId]
  );

  if (jobRows.length === 0) {
    throw new Error('Job not found.');
  }

  const isUrgent = jobRows[0].urgent;
  const WEIGHTS  = isUrgent ? WEIGHTS_URGENT : WEIGHTS_NORMAL;

  // Collapse job skills (multiple rows from the join above)
  const jobSkills = jobRows
    .filter(r => r.skillId !== null)
    .map(r => ({
      skillId:             r.skillId,
      isMandatory:         !!r.isMandatory,
      minProficiencyLevel: r.minProficiencyLevel,
    }));

  // 2. Get all pending applicants with their stats
  const [applicants] = await pool.query(
    `SELECT ja.applicationId, ja.applicantId,
            s.name, s.workerRating, s.workerRatingCount,
            s.jobsPostedCount, s.jobsCompletedCount, s.totalVouchCount,
            s.verifiedReviewer
     FROM JobApplication ja
     JOIN Student s ON s.studentId = ja.applicantId
     WHERE ja.jobId = ? AND ja.status = 'PENDING' AND s.deletedAt IS NULL`,
    [jobId]
  );

  if (applicants.length === 0) {
    return [];
  }

  // 3. Fetch all applicant skills in a single query (efficient — one trip to DB)
  const applicantIds = applicants.map(a => a.applicantId);
  const [allSkills] = await pool.query(
    `SELECT studentId, skillId, proficiencyLevel, relevantComp
     FROM StudentSkill
     WHERE studentId IN (?)`,
    [applicantIds]
  );

  // Group skills by studentId for O(1) lookup
  // { studentId: { skillId: { proficiencyLevel, relevantComp } } }
  const skillsByStudent = {};
  for (const skill of allSkills) {
    if (!skillsByStudent[skill.studentId]) skillsByStudent[skill.studentId] = {};
    skillsByStudent[skill.studentId][skill.skillId] = skill;
  }

  // 4. Score each applicant
  const scored = [];

  for (const applicant of applicants) {
    const applicantSkillMap = skillsByStudent[applicant.applicantId] || {};

    // a) Skill Match Score
    const { score: skillMatchRaw, disqualified } = calculateSkillMatchScore(
      jobSkills,
      applicantSkillMap
    );

    if (disqualified) {
      // Don't include disqualified applicants in ranked list
      // but update their score to 0 so frontend can show "does not meet requirements"
      await pool.query(
        'UPDATE JobApplication SET rankScore = 0 WHERE applicationId = ?',
        [applicant.applicationId]
      );
      continue;
    }

    // b) Verified Skills — what fraction of their job skills are "verified"
    //    A skill is verified if relevantComp > 0 (completed at least one job using it)
    const studentSkills = Object.values(applicantSkillMap);
    const verifiedCount = studentSkills.filter(sk => sk.relevantComp > 0).length;
    const verifiedRatio = studentSkills.length > 0 ? verifiedCount / studentSkills.length : 0;

    // c) Completion rate
    const completionNorm = normalizeCompletionRate(
      applicant.jobsCompletedCount,
      applicant.jobsPostedCount
    );

    // d) Rating (normalized 1-5 → 0-1)
    const ratingNorm = normalizeRating(applicant.workerRating);

    // e) Vouch count
    const vouchNorm = normalizeVouch(applicant.totalVouchCount);

    // f) Weighted composite score (0–1)
    const rawScore =
      WEIGHTS.skillMatch      * skillMatchRaw   +
      WEIGHTS.verifiedSkills  * verifiedRatio   +
      WEIGHTS.completionRate  * completionNorm  +
      WEIGHTS.rating          * ratingNorm      +
      WEIGHTS.vouchCount      * vouchNorm;

    // Scale to 0–100 with 3 decimal places
    const rankScore = Math.round(rawScore * 100 * 1000) / 1000;

    scored.push({
      applicationId:  applicant.applicationId,
      applicantId:    applicant.applicantId,
      name:           applicant.name,
      workerRating:   applicant.workerRating,
      totalVouchCount: applicant.totalVouchCount,
      jobsCompleted:  applicant.jobsCompletedCount,
      verifiedReviewer: applicant.verifiedReviewer,
      rankScore,
      scoreBreakdown: {
        skillMatch:     Math.round(skillMatchRaw * 100),
        verifiedSkills: Math.round(verifiedRatio * 100),
        completionRate: Math.round(completionNorm * 100),
        rating:         Math.round(ratingNorm * 100),
        vouchCount:     Math.round(vouchNorm * 100),
      },
    });

    // Persist the score so it's cached for future reads
    await pool.query(
      'UPDATE JobApplication SET rankScore = ? WHERE applicationId = ?',
      [rankScore, applicant.applicationId]
    );
  }

  // 5. Sort descending by rankScore
  scored.sort((a, b) => b.rankScore - a.rankScore);

  return scored;
}

module.exports = { rankApplicants };



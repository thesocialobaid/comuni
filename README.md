# Comuni — Campus Freelance Platform
### Backend API

**Course:** Database Systems Project  
**Team:**
| Name | Role |
|------|------|
| Obaid | Backend & Database |
| Haajra Mumtaz | API Testing & Design |
| Maida Adnan | API Testing & Design |

---

## Table of Contents

1. [What is this project?](#what-is-this-project)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Setup Guide](#setup-guide-start-here)
5. [Environment Variables](#environment-variables)
6. [How to Run](#how-to-run)
7. [Testing with Postman](#testing-with-postman)
8. [Full API Reference](#full-api-reference)
9. [Status Codes](#status-codes)
10. [Job & Application Status Flow](#job--application-status-flow)
11. [Common Errors & Fixes](#common-errors--fixes)
12. [Notes for Testers](#notes-for-testers-haajra--maida)

---

## What is this project?

Comuni is a micro-gig marketplace exclusively for NU university students. Students can post short-term jobs (tutoring, coding, design, etc.) and peers can apply. The platform uses a weighted ranking algorithm to recommend the best applicant for each job based on skill match, ratings, completion rate, and vouches.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MySQL 8 |
| Auth | JWT (JSON Web Tokens) |
| Password Hashing | bcryptjs |
| File Uploads | multer |
| Dev Tool | nodemon |

---

## Project Structure

```
comuni-backend/
│
├── uploads/
│   └── profiles/          ← profile pictures saved here (auto-created)
│
├── src/
│   ├── app.js             ← entry point, starts the server
│   │
│   ├── config/
│   │   └── db.js          ← MySQL connection pool
│   │
│   ├── middleware/
│   │   ├── auth.js        ← checks JWT token on protected routes
│   │   ├── errorHandler.js← catches all errors, sends clean response
│   │   └── upload.js      ← handles profile picture file uploads
│   │
│   ├── controllers/       ← actual logic for each feature
│   │   ├── auth.controller.js
│   │   ├── student.controller.js
│   │   ├── job.controller.js
│   │   ├── application.controller.js
│   │   ├── review.controller.js
│   │   ├── skill.controller.js
│   │   └── vouch.controller.js
│   │
│   ├── routes/            ← maps URLs to controller functions
│   │   ├── auth.routes.js
│   │   ├── student.routes.js
│   │   ├── job.routes.js
│   │   ├── skill.routes.js
│   │   ├── application.routes.js
│   │   └── vouch.routes.js
│   │
│   └── services/
│       └── ranking.service.js  ← weighted ranking engine (Level 3)
│
├── .env                   ← your local config (never share or commit this)
├── .env.example           ← template for what .env should look like
├── jsconfig.json          ← stops VS Code showing false casing errors on Windows
└── package.json           ← project dependencies
```

---

## Setup Guide (Start Here)

Follow these steps **in order**. Do this once when you first get the project.

### Step 1 — Check required software

```bash
node --version     # needs v18 or higher
npm --version      # comes with Node
mysql --version    # needs MySQL 8
```

If Node is missing → **nodejs.org** (download LTS)  
If MySQL is missing → **dev.mysql.com/downloads/installer**

### Step 2 — Install dependencies

Inside the project folder, run:

```bash
npm install
```

This downloads all libraries into `node_modules`. Do not touch that folder.

### Step 3 — Set up the database

Open MySQL terminal or Workbench and run:

```sql
CREATE DATABASE communitask;
```

Then import the schema file:

```bash
mysql -u root -p communitask < proj-campusfree.sql
```

### Step 4 — Create your .env file

Create a file called `.env` in the project root. Copy from `.env.example` and fill in your values:

```
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=communitask

JWT_SECRET=any_long_random_string_you_make_up
JWT_EXPIRES_IN=7d

BCRYPT_ROUNDS=10
```

> Each team member has their own `.env` with their own MySQL password. Never share this file.

### Step 5 — Create the uploads folder

Manually create this in the project root:

```
uploads/
  └── profiles/
```

### Step 6 — Start the server

```bash
npm run dev
```

You should see:
```
✅  MySQL connected successfully
🚀  CommuniTask API running on http://localhost:3000
```

Visit `http://localhost:3000/health` in your browser — you should see `{ "status": "ok" }`.

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Port the server runs on | `3000` |
| `DB_HOST` | MySQL host | `localhost` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_USER` | MySQL username | `root` |
| `DB_PASSWORD` | MySQL password | `yourpassword` |
| `DB_NAME` | Database name | `communitask` |
| `JWT_SECRET` | Signs auth tokens — keep secret | any long random string |
| `JWT_EXPIRES_IN` | How long login lasts | `7d` |
| `BCRYPT_ROUNDS` | Password hashing strength | `10` |

---

## How to Run

| Command | When to use |
|---------|-------------|
| `npm run dev` | Development — restarts automatically on file save |
| `npm start` | Production — no auto-restart |

---

## Testing with Postman

### Initial Setup

1. Download Postman at **postman.com**
2. Create a new Collection called `Comuni API`
3. In Collection Settings → Variables → add variable `baseUrl` = `http://localhost:3000`

### Saving Your Token (Do This Once)

After login or register you get a `token` in the response. Instead of pasting it into every request:

1. Copy the token value
2. Go to your Collection → **Authorization** tab
3. Set Type to `Bearer Token`
4. Paste the token
5. Every request in the collection now sends it automatically

To test as a different student, just update this token.

### Two Body Types

**Most endpoints → Body → raw → JSON**

**Register only → Body → form-data** (because it has a file upload)
- Add each text field as key/value
- For `profilePicture`: change the dropdown next to the key from `Text` to `File`

---

## Full API Reference

**Base URL:** `http://localhost:3000/api`

🔓 = No token needed &nbsp;&nbsp; 🔐 = Requires `Authorization: Bearer <token>`

---

### AUTH

#### Register
`POST /api/auth/register` 🔓

Body type: **form-data** (not JSON)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| rollNumber | text | ✅ | e.g. `24L-0698` |
| email | text | ✅ | Must end in `@nu.edu.pk` or `@cs.nu.edu.pk` etc. |
| password | text | ✅ | Min 6 characters |
| name | text | ✅ | Full name |
| bio | text | ❌ | Short description |
| profilePicture | file | ❌ | jpg / png / webp, max 2MB |

**Success (201):**
```json
{
  "success": true,
  "message": "Registration successful.",
  "token": "eyJhbGci...",
  "student": {
    "studentId": 1,
    "rollNumber": "24L-0698",
    "email": "24l-0698@nu.edu.pk",
    "name": "Ali Hassan",
    "bio": "CS student",
    "profilePicture": "/uploads/profiles/1714500123-847291034.jpg",
    "workerRating": 0,
    "totalVouchCount": 0,
    "verifiedReviewer": false
  }
}
```

---

#### Login
`POST /api/auth/login` 🔓

Body type: JSON

```json
{
  "email": "24l-0698@nu.edu.pk",
  "password": "test123"
}
```

> You can also put your roll number in the `email` field — both work.

**Success (200):** Same shape as register response.

---

#### Get Current User
`GET /api/auth/me` 🔐

Returns the full profile of whoever owns the token.

---

### STUDENTS

#### List All Students
`GET /api/students` 🔐

Optional: `?search=ali` — filter by name or roll number.

---

#### Get Student Profile
`GET /api/students/:studentId` 🔐

Returns public profile + their skills + completion rate + vouch count.

---

#### Update My Profile
`PATCH /api/students/me` 🔐

Body type: JSON — only send what you want to change:
```json
{
  "name": "Updated Name",
  "bio": "Updated bio"
}
```

---

#### Delete My Account
`DELETE /api/students/me` 🔐

Soft-delete — account becomes inactive, data is preserved for integrity.

---

#### Get My Skills
`GET /api/students/me/skills` 🔐

---

#### Add Skill to My Profile
`POST /api/students/me/skills` 🔐

```json
{
  "skillId": 3,
  "proficiencyLevel": "ADVANCED"
}
```

Proficiency levels (exact): `BEGINNER` | `INTERMEDIATE` | `ADVANCED` | `EXPERT`

---

#### Update Skill Proficiency
`PATCH /api/students/me/skills/:skillId` 🔐

```json
{
  "proficiencyLevel": "EXPERT"
}
```

---

#### Remove Skill from Profile
`DELETE /api/students/me/skills/:skillId` 🔐

---

#### Get Student's Reviews
`GET /api/students/:studentId/reviews` 🔐

---

#### Get Student's Vouches
`GET /api/students/:studentId/vouches` 🔐

Optional: `?skillId=2` to filter by skill.

---

### SKILLS

#### List All Skills
`GET /api/skills` 🔓

Optional: `?search=python` or `?category=Programming`

---

#### Get Skill Categories
`GET /api/skills/categories` 🔓

Returns all category names for dropdown menus.

---

#### Get Single Skill
`GET /api/skills/:skillId` 🔓

---

#### Create New Skill
`POST /api/skills` 🔐

```json
{
  "skillName": "React.js",
  "category": "Web Development"
}
```

---

### JOBS

#### Browse Jobs
`GET /api/jobs` 🔐

| Query Param | Example | Effect |
|-------------|---------|--------|
| `status` | `?status=OPEN` | Filter by job status |
| `urgent` | `?urgent=true` | Only urgent jobs |
| `search` | `?search=tutor` | Search title and description |
| `skillId` | `?skillId=3` | Jobs requiring a specific skill |
| `sortBy` | `?sortBy=deadline` | `newest` / `deadline` / `budget` |

Default shows only `OPEN` jobs.

---

#### Post a Job
`POST /api/jobs` 🔐

```json
{
  "title": "Need Python tutor for OOP concepts",
  "description": "Weekly 1hr sessions for 4 weeks, flexible timing",
  "budget": 2000.00,
  "deadline": "2025-05-01T18:00:00",
  "urgent": false,
  "skills": [
    {
      "skillId": 1,
      "isMandatory": true,
      "minProficiencyLevel": "INTERMEDIATE"
    },
    {
      "skillId": 2,
      "isMandatory": false,
      "minProficiencyLevel": "BEGINNER"
    }
  ]
}
```

The `skills` array is optional.

---

#### Get My Posted Jobs
`GET /api/jobs/mine` 🔐

---

#### Get Job Detail
`GET /api/jobs/:jobId` 🔐

Returns full job info including required skills and applicant count.

---

#### Update a Job
`PATCH /api/jobs/:jobId` 🔐

Only the poster can do this. Only works if job is `OPEN`.

```json
{
  "budget": 2500.00,
  "urgent": true
}
```

---

#### Cancel a Job
`DELETE /api/jobs/:jobId` 🔐

Only the poster can do this.

```json
{
  "cancellationReason": "Found someone through other means"
}
```

---

#### Mark Job as Completed
`PATCH /api/jobs/:jobId/complete` 🔐

Only the poster. Job must be `IN_PROGRESS`. No body needed.

Automatically increments the worker's completed job count and grants `verifiedReviewer` if they've now done 3+ jobs.

---

#### Add Required Skill to Job
`POST /api/jobs/:jobId/skills` 🔐

```json
{
  "skillId": 4,
  "isMandatory": true,
  "minProficiencyLevel": "ADVANCED"
}
```

---

#### Remove Required Skill from Job
`DELETE /api/jobs/:jobId/skills/:skillId` 🔐

---

### APPLICATIONS

#### Apply to a Job
`POST /api/jobs/:jobId/apply` 🔐

No body needed. Guards: cannot apply to own job, cannot apply twice, job must be `OPEN`.

---

#### View Ranked Applicants
`GET /api/jobs/:jobId/applications` 🔐

Only the job poster can call this. Triggers the ranking engine.

Scoring weights (Normal job):

| Signal | Weight |
|--------|--------|
| Skill Match | 40% |
| Verified Skills | 15% |
| Completion Rate | 20% |
| Worker Rating | 15% |
| Vouch Count | 10% |

For **urgent** jobs: Skill Match → 50%, Completion Rate → 25%.

**Response:**
```json
{
  "ranked": [
    {
      "applicationId": 1,
      "applicantId": 5,
      "name": "Sara Ahmed",
      "workerRating": 4.5,
      "totalVouchCount": 3,
      "rankScore": 82.4,
      "scoreBreakdown": {
        "skillMatch": 90,
        "verifiedSkills": 60,
        "completionRate": 80,
        "rating": 88,
        "vouchCount": 40
      }
    }
  ],
  "resolved": []
}
```

Applicants without mandatory skills are disqualified (score = 0, not shown in ranked list).

---

#### Accept an Application
`PATCH /api/jobs/:jobId/applications/:applicationId/accept` 🔐

Only poster. Automatically rejects all other pending applicants and sets job to `IN_PROGRESS`.

---

#### Reject an Application
`PATCH /api/jobs/:jobId/applications/:applicationId/reject` 🔐

Only poster.

---

#### Withdraw My Application
`DELETE /api/jobs/:jobId/applications/:applicationId` 🔐

Only the applicant. Application must be `PENDING`.

---

#### My Applications
`GET /api/applications/mine` 🔐

All jobs you have applied to, with current status.

---

### REVIEWS

#### Submit a Review
`POST /api/jobs/:jobId/reviews` 🔐

Job must be `COMPLETED`. Body type: JSON.

```json
{
  "rating": 5,
  "comment": "Excellent work, delivered on time!"
}
```

Rating must be a whole number 1–5.

The system determines who you are reviewing automatically:
- You are the **poster** → you review the **worker** (updates `workerRating`)
- You are the **worker** → you review the **poster** (updates `giverRating`)

---

#### Get Job Reviews
`GET /api/jobs/:jobId/reviews` 🔐

---

### VOUCHES

> Only students with `verifiedReviewer: true` can give vouches. Becomes true after completing 3+ jobs.

#### Give a Vouch
`POST /api/vouches` 🔐

```json
{
  "voucheeId": 7,
  "skillId": 3,
  "comment": "Brilliant at React, shipped a full project in a week"
}
```

`skillId` is optional — leave it out for a general trust vouch.

---

#### My Given Vouches
`GET /api/vouches/mine` 🔐

---

#### Retract a Vouch
`DELETE /api/vouches/:vouchId` 🔐

---

## Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created (new record inserted) |
| `400` | Bad request — missing or invalid field |
| `401` | Unauthorized — no token, or token expired |
| `403` | Forbidden — you don't have permission for this action |
| `404` | Not found |
| `409` | Conflict — duplicate record (already applied, email taken, etc.) |
| `500` | Server error |

All error responses:
```json
{
  "success": false,
  "message": "Explanation of what went wrong"
}
```

---

## Job & Application Status Flow

```
Job:
  OPEN → IN_PROGRESS → COMPLETED
  OPEN → CANCELLED
  IN_PROGRESS → CANCELLED

Application:
  PENDING → ACCEPTED   (poster accepts)
  PENDING → REJECTED   (poster rejects, or another applicant was accepted)
  PENDING → WITHDRAWN  (applicant pulls out)
```

---

## Common Errors & Fixes

| Error Message | Cause | Fix |
|---------------|-------|-----|
| `Access denied for user 'root'` | Wrong DB password | Fix `DB_PASSWORD` in `.env` |
| `Unknown database 'communitask'` | DB not created yet | Run `CREATE DATABASE communitask;` in MySQL |
| `Cannot find module 'express'` | npm install not run | Run `npm install` |
| `EADDRINUSE port 3000` | Port already in use | Change `PORT=3001` in `.env` |
| `Only NU university emails are allowed` | Non-NU email used | Use your official `@nu.edu.pk` email |
| `Invalid or expired token` | Token is older than 7 days | Login again to get a fresh token |
| `Only OPEN jobs can be edited` | Job already in progress | Can only edit jobs with status `OPEN` |
| `Only verified students can give vouches` | Less than 3 completed jobs | Complete 3 jobs first |
| Red underline on `errorHandler` in VS Code | Windows file casing warning | Add `jsconfig.json` — not a real bug, code works fine |

---

## Notes for Testers (Haajra & Maida)

### Recommended test order — the full happy path

Follow this flow to test every feature end to end:

```
1.  Register Student A (job poster)       POST /api/auth/register
2.  Register Student B (freelancer)       POST /api/auth/register
3.  Create a skill in the catalogue       POST /api/skills
4.  Add that skill to Student B profile  POST /api/students/me/skills
5.  Student A posts a job with that skill POST /api/jobs
6.  Student B applies to the job         POST /api/jobs/:jobId/apply
7.  Student A views ranked applicants    GET  /api/jobs/:jobId/applications
8.  Student A accepts Student B          PATCH /api/jobs/:jobId/applications/:id/accept
9.  Student A marks job complete         PATCH /api/jobs/:jobId/complete
10. Student A reviews Student B          POST /api/jobs/:jobId/reviews
11. Student B reviews Student A          POST /api/jobs/:jobId/reviews  (switch token)
12. Repeat steps 5-11 two more times with Student B as worker
13. Student B now has verifiedReviewer: true — test giving a vouch
```

### Edge cases worth testing

| Test | Expected result |
|------|----------------|
| Register with `@gmail.com` | 400 — NU email required |
| Register same email twice | 409 — already exists |
| Apply to your own job | 400 — not allowed |
| Apply to same job twice | 409 — already applied |
| Review a job that isn't completed | 400 — job must be COMPLETED |
| Review same job twice | 409 — already reviewed |
| Give vouch with less than 3 completed jobs | 403 — not verified |
| Accept application on non-OPEN job | 400 — job not open |
| Edit job after it's IN_PROGRESS | 400 — only OPEN jobs editable |
| Access protected route without token | 401 — no token |
| Use expired or fake token | 401 — invalid token |

### Switching between students in Postman

Keep two Postman environments — one with Student A's token, one with Student B's. Switch between them to test both sides of each interaction (poster vs. worker, reviewer vs. reviewee).

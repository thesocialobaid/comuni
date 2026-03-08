-- 24L-0698,24L-0650,24L-0509
DROP DATABASE IF EXISTS communitask;
<<<<<<< Updated upstream
<<<<<<< Updated upstream

=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
CREATE DATABASE IF NOT EXISTS communitask;
use communitask;

CREATE TABLE Student (
    studentId        INT AUTO_INCREMENT PRIMARY KEY,

    rollNumber       VARCHAR(50)  UNIQUE NOT NULL,
    email            VARCHAR(100) UNIQUE NOT NULL,
    passwordHash     VARCHAR(255) NOT NULL,

    name             VARCHAR(100) NOT NULL,
    bio              TEXT,
    profilePicture   VARCHAR(255),

    -- Ratings as worker (job taker) 
    workerRating      DECIMAL(3,2) DEFAULT 0.00,
    workerRatingCount INT          DEFAULT 0,

    -- Ratings as job poster (client) 
    giverRating       DECIMAL(3,2) DEFAULT 0.00,
    giverRatingCount  INT DEFAULT 0,

    
    jobsPostedCount    INT DEFAULT 0,
    jobsCompletedCount INT DEFAULT 0,

    -- Vouch count 
    totalVouchCount INT DEFAULT 0,

    -- Completion rate is derived: jobsCompletedCount / jobsPostedCount

    -- A student becomes a verified reviewer after completing >= 3 jobs. Only verified reviewers can vouch.
    verifiedReviewer BOOLEAN DEFAULT FALSE,

    -- Soft delete: set deletedAt instead of hard DELETE so record remains 
    deletedAt DATETIME NULL DEFAULT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


-- SKILL
-- Global skill catalogue. Skills are reused across StudentSkill and JobSkill.


CREATE TABLE Skill (
    skillId   INT AUTO_INCREMENT PRIMARY KEY,

    skillName VARCHAR(100) UNIQUE NOT NULL,
    category  VARCHAR(100)
);


-- STUDENT SKILL
-- Junction between Student and Skill because many to many relationship 

CREATE TABLE StudentSkill (
    studentSkillId INT AUTO_INCREMENT PRIMARY KEY,

    studentId INT NOT NULL,
    skillId   INT NOT NULL,

    proficiencyLevel ENUM(
        'BEGINNER',
        'INTERMEDIATE',
        'ADVANCED',
        'EXPERT'
    ) DEFAULT 'BEGINNER',



    -- How many peers have approved of this student on this specific skill.
    relevantComp INT DEFAULT 0,

    addedAt DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (studentId) REFERENCES Student(studentId) ON DELETE CASCADE,
    FOREIGN KEY (skillId)   REFERENCES Skill(skillId)    ON DELETE CASCADE,

    UNIQUE (studentId, skillId)
);



CREATE TABLE Job (
    jobId   INT AUTO_INCREMENT PRIMARY KEY,
    postedBy INT NOT NULL,
    title       VARCHAR(200) NOT NULL,
    description TEXT,
    budget   DECIMAL(10,2),
    deadline DATETIME,
    -- When urgent=TRUE the ranking engine applies URGENCY_MULTIPLIER.
    urgent BOOLEAN DEFAULT FALSE,
    status ENUM(
        'OPEN',
        'ASSIGNED',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELLED'
    ) DEFAULT 'OPEN',
    assignedTo INT NULL DEFAULT NULL,

    -- Populated when status transitions to CANCELLED.
    -- Allows analytics on why jobs fall through.
    cancellationReason VARCHAR(255) NULL DEFAULT NULL,
    cancelledAt        DATETIME     NULL DEFAULT NULL,

    createdAt   DATETIME DEFAULT CURRENT_TIMESTAMP,
    completedAt DATETIME NULL DEFAULT NULL,

    FOREIGN KEY (postedBy)   REFERENCES Student(studentId),
    FOREIGN KEY (assignedTo) REFERENCES Student(studentId)
);


-- JOB SKILL (JobRequirement in UML) INTEREDIATE TABLE B/W Job and Skill (This job requires this skill (with conditions)
-- Skills required for a job posting.
-- minProficiencyLevel is used by the ranking engine for skill-match scoring.
-- ------A job requires multiple skills + A skill can be required by multiple jobs so many to many 



-- cant delete, need later for history

CREATE TABLE JobSkill (
    jobSkillId INT AUTO_INCREMENT PRIMARY KEY,

    jobId   INT NOT NULL,
    skillId INT NOT NULL,

    -- If TRUE, applicants without this skill are disqualified entirely.
    isMandatory BOOLEAN DEFAULT TRUE,

    -- Minimum proficiency level an applicant must hold to qualify.
    minProficiencyLevel ENUM(
        'BEGINNER',
        'INTERMEDIATE',
        'ADVANCED',
        'EXPERT'
    ) DEFAULT 'BEGINNER',

    FOREIGN KEY (jobId)   REFERENCES Job(jobId)     ON DELETE CASCADE,
    FOREIGN KEY (skillId) REFERENCES Skill(skillId) ON DELETE RESTRICT,

    UNIQUE (jobId, skillId)
);

-- JOB APPLICATION
-- Tracks every student application to a job.
-- rankScore is populated by the ranking engine after application is submitted.


CREATE TABLE JobApplication (
    applicationId INT AUTO_INCREMENT PRIMARY KEY,

    jobId       INT NOT NULL,
    applicantId INT NOT NULL,


    status ENUM(
        'PENDING',
        'ACCEPTED',
        'REJECTED',
        'WITHDRAWN'
    ) DEFAULT 'PENDING',

    -- Computed using weights etc in. Stored for sorting/display without re-computing.
    rankScore DECIMAL(6,3) NULL DEFAULT NULL,

    appliedAt  DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolvedAt DATETIME NULL DEFAULT NULL, -- set when ACCEPTED / REJECTED / WITHDRAWN

    FOREIGN KEY (jobId)       REFERENCES Job(jobId)         ON DELETE CASCADE,
    FOREIGN KEY (applicantId) REFERENCES Student(studentId) ON DELETE CASCADE,

    UNIQUE (jobId, applicantId) -- so one applicant can apply to the job only once 
);


-- REVIEW
-- Post-job ratings between poster and worker.
-- Both parties can review each other after job completion.
-- The UNIQUE constraint prevents duplicate reviews for the same job pair.

CREATE TABLE Review (
    reviewId INT AUTO_INCREMENT PRIMARY KEY,

    jobId      INT NOT NULL,
    reviewerId INT NOT NULL,
    revieweeId INT NOT NULL,

    rating  INT  NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,

    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (jobId)      REFERENCES Job(jobId)         ON DELETE RESTRICT,
    FOREIGN KEY (reviewerId) REFERENCES Student(studentId) ON DELETE CASCADE,
    FOREIGN KEY (revieweeId) REFERENCES Student(studentId) ON DELETE CASCADE,

    UNIQUE (jobId, reviewerId, revieweeId)

);



-- VOUCH
-- Peer trust endorsements. A vouch can be general or skill-specific.
-- Only students with verifiedReviewer = TRUE can create vouches.


CREATE TABLE Vouch (
    vouchId INT AUTO_INCREMENT PRIMARY KEY,

    voucherId INT NOT NULL, -- the student giving the vouch
    voucheeId INT NOT NULL, -- the student receiving the vouch

    -- NULL = general trust vouch; NOT NULL = skill-specific endorsement
    skillId INT NULL DEFAULT NULL,

    -- Gives context to the endorsement.
    comment TEXT,

    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (voucherId) REFERENCES Student(studentId) ON DELETE CASCADE,
    FOREIGN KEY (voucheeId) REFERENCES Student(studentId) ON DELETE CASCADE,
    FOREIGN KEY (skillId)   REFERENCES Skill(skillId)     ON DELETE SET NULL,

    UNIQUE (voucherId, voucheeId, skillId)

);

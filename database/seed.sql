
INSERT INTO Student (rollNumber, email, passwordHash, name, bio)
VALUES
('24L-1111', 'h@example.com', 'hashedpwd1', 'H', 'Web Developer'),
('24L-0600', 'm@example.com', 'hashedpwd2', 'M', 'Data Analyst'),
('24L-0010', 'o@example.com', 'hashedpwd3', 'O', 'Graphic Designer');

INSERT INTO Skill (skillName, category)
VALUES
('HTML', 'Web Development'),
('JavaScript', 'Web Development'),
('Python', 'Programming'),
('SQL', 'Database'),
('Photoshop', 'Design');


-- H
INSERT INTO StudentSkill (studentId, skillId, proficiencyLevel, relevantComp)
VALUES
(1, 1, 'ADVANCED', 5),
(1, 2, 'INTERMEDIATE', 3),
(1, 3, 'BEGINNER', 2);

-- M
INSERT INTO StudentSkill (studentId, skillId, proficiencyLevel, relevantComp)
VALUES
(2, 3, 'ADVANCED', 6),
(2, 4, 'INTERMEDIATE', 4);

-- O
INSERT INTO StudentSkill (studentId, skillId, proficiencyLevel, relevantComp)
VALUES
(3, 5, 'EXPERT', 7),
(3, 1, 'BEGINNER', 1);


INSERT INTO Job (postedBy, title, description, budget, deadline, urgent)
VALUES
(1, 'Build Portfolio Website', 'Need a personal portfolio website', 500.00, '2026-03-15 23:59:59', TRUE),
(2, 'Data Cleaning Project', 'Clean messy CSVs and prepare analysis', 300.00, '2026-03-20 23:59:59', FALSE),
(3, 'Design Logo', 'Create a new logo for our startup', 200.00, '2026-03-18 23:59:59', FALSE);


-- Job 1: Portfolio Website
INSERT INTO JobSkill (jobId, skillId, isMandatory, minProficiencyLevel)
VALUES
(1, 1, TRUE, 'INTERMEDIATE'),  -- HTML
(1, 2, TRUE, 'INTERMEDIATE');  -- JavaScript

-- Job 2: Data Cleaning
INSERT INTO JobSkill (jobId, skillId, isMandatory, minProficiencyLevel)
VALUES
(2, 3, TRUE, 'INTERMEDIATE'),  -- Python
(2, 4, FALSE, 'BEGINNER');    -- SQL

-- Job 3: Logo Design
INSERT INTO JobSkill (jobId, skillId, isMandatory, minProficiencyLevel)
VALUES
(3, 5, TRUE, 'INTERMEDIATE'); -- Photoshop





-- H applies to Job 2
INSERT INTO JobApplication (jobId, applicantId, rankScore)
VALUES
(2, 1, 0.85);

-- M applies to Job 1
INSERT INTO JobApplication (jobId, applicantId, rankScore)
VALUES
(1, 2, 0.90);

-- O applies to Job 3
INSERT INTO JobApplication (jobId, applicantId, rankScore)
VALUES
(2, 3, 0.95);

-- o  applies to Job 3 as well
INSERT INTO JobApplication (jobId, applicantId, rankScore)
VALUES
(3, 3, 0.60);



UPDATE JobApplication
SET status = 'ACCEPTED'
WHERE jobId = 1 AND applicantId = 2;

-- Update Job 1 to assignedTo
UPDATE Job
SET assignedTo = 2, status = 'IN_PROGRESS'
WHERE jobId = 1;


UPDATE JobApplication
SET status = 'ACCEPTED'
WHERE jobId = 2 AND applicantId = 1;

UPDATE JobApplication
SET status = 'REJECTED'
WHERE jobId = 2 AND applicantId = 3;

-- Update Job 2 assignedTo
UPDATE Job
SET assignedTo = 1, status = 'IN_PROGRESS'
WHERE jobId = 2;



-- Job 1 completed (assigned to studentId = 2)
UPDATE Job
SET status = 'COMPLETED',
    completedAt = '2026-02-25 18:00:00'
WHERE jobId = 1;

-- Job 2 completed (assigned to studentId = 1)
UPDATE Job
SET status = 'COMPLETED',
    completedAt = '2026-02-26 16:30:00'
WHERE jobId = 2;

-- Job 1: Poster  reviews worker 
INSERT INTO Review (jobId, reviewerId, revieweeId, rating, comment)
VALUES
(1, 1, 2, 5, 'excellent job on the portfolio website');

-- Job 1: Worker  reviews poster
INSERT INTO Review (jobId, reviewerId, revieweeId, rating, comment)
VALUES
(1, 2, 1, 4, 'provided clear instructions and support');

select * from Student;
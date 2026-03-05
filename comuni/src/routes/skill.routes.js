/**
 * skill.routes.js
 *
 * GET  /api/skills            → List all skills (with optional ?category= or ?search=)
 * GET  /api/skills/categories → List distinct categories
 * GET  /api/skills/:skillId   → Single skill detail
 * POST /api/skills            → Create a new skill (authenticated)
 */


const express = require('express');
const router = express.Router(); 
const skillCtrl = require('../controllers/skill.controller');
const { authenticate } = require('../middleware/auth');

router.get('/', skillCtrl.listSkills);
router.get('/categories', skillCtrl.listCategories);
router.get('/:skillId', skillCtrl.getSkillById);

//Creating skills requires login 
router.post('/',authenticate, skillCtrl.createSkill);

module.exports = router;

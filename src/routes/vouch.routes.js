/* 
vouch.routes.js is the router for the voucher feature. 
The feature allows me to manage the vouch features from the 
front end of the react application. 

POST /api/vouces --> Gives a vouch 
GET /api/vouches/mine --> Vouches I have given 
DELETE /api/vouches/:vouchId -> Retract a vouch 

Express? 
It is a web framework for Node.js that makes it eaiser to create API endpoints that the frontend can talk to

Router: 
Instead of defining the router in one giant file, express lets you split them into seperate files
using Router(), and each file does this step by step. 
*/

const express = require('express');
const router = express.Router(); 
const vouchCtrl = require('../controllers/vouch.controller'); 
const { authenticate } = require('../middleware/auth'); 

router.use(authenticate); 

router.post('/',    vouchCtrl.giveVouch);
router.get('/mine', vouchCtrl.getMyGivenVouches);
router.delete('/:vouchId', vouchCtrl.retractVouch); 

module.exports = router; 


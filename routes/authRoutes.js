const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');

router.post('/sign-up', authController.signupUser);
router.post('/sign-in', authController.signinUser);

module.exports = router;
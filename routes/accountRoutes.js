const express = require('express');
const router = express.Router();
const dbIndex = require('../libs/index');

const authMiddleware = require('../middleware/authMiddleware');
const accountController = require('../controllers/accountcontroller');

router.get('/:id?', authMiddleware, accountController.getAccounts) // Get all accounts or a specific account
router.post('/create', authMiddleware, accountController.createAccount) // Create a new account
router.put('/add-money/:id', authMiddleware, accountController.addMoneyToAccount) // Add money to an account

module.exports = router;
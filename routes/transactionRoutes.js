const express = require('express');
const router = express.Router();

const transactionController = require('../controllers/transactionController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, transactionController.getTransactions);
router.get('/dashboard', authMiddleware, transactionController.getDashboardInformation);
router.post('/add-transaction/:account_id', authMiddleware, transactionController.addTransaction);
router.put('/transfer-money', authMiddleware, transactionController.transferMoneyToAccount);

module.exports = router;
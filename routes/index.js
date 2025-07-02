require('dotenv').config();
const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const accountRoutes = require('./accountRoutes');
const transactionRoutes = require('./transactionRoutes');

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/account', accountRoutes);
router.use('/transaction', transactionRoutes);

module.exports = router;
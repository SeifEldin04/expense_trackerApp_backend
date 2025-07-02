const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');

router.get('/', authMiddleware, userController.getUser);
router.get('/users', authMiddleware, userController.getUsers);
router.put('/change-password' ,authMiddleware, userController.changePassword);
router.put('/' ,authMiddleware, userController.updateUser);

module.exports = router;
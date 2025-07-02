const pool = require('../libs/db');
const httpStatusText = require('../utils/httpStatusText');
const dbIndex = require('../libs/index');

const getUser = async (req, res) => {
    try {
        const { userId } = req.user; // Extract user_id from token

        const userExist = await pool.query('SELECT * FROM tbluser WHERE id = $1', [userId]);

        if (userExist.rows.length === 0) { // Check if user exists
            return res.status(404).json({ status: httpStatusText.FAILED, message: 'User not found' });
        }

        res.status(200).json({ status: httpStatusText.SUCCESS, user: userExist.rows[0] });


    } catch (error) {
        console.error(error);
        res.status(500).json({ status: httpStatusText.FAILED, message: error.message });
    }
};


const getUsers = async (req, res) => {
    try {
        const users = await pool.query('SELECT * FROM tbluser'); // Fetch all users from database
        
        if (users.rows.length === 0) {
            return res.status(404).json({ status: httpStatusText.FAILED, message: 'No users found' });
        }
        res.status(200).json({ status: httpStatusText.SUCCESS, users: users.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: httpStatusText.FAILED, message: error.message });
    }
}


const changePassword = async (req, res) => {
    try {
        const { userId } = req.user; // Extract user_id from token
        const { currentPassword, newPassword, confirmPassword } = req.body; // Extract data from request body

        const userExist = await pool.query('SELECT * FROM tbluser WHERE id = $1', [userId]); // Check if user exists

        if (userExist.rows.length === 0) {
            return res.status(404).json({ status: httpStatusText.FAILED, message: 'User not found' });
        }

        if (newPassword !== confirmPassword) { // Check if new password and confirm password match
            return res.status(400).json({ status: httpStatusText.FAILED, message: 'Passwords do not match' });
        }
        const isMatch = await dbIndex.comparePassword(currentPassword, userExist.rows[0].password);

        if (!isMatch) { // Check if current password is correct
            return res.status(400).json({ status: httpStatusText.FAILED, message: 'Current password is incorrect' });
        }

        const hashedPassword = await dbIndex.hashPassword(newPassword); // Hash new password

        const updatedUser = await pool.query(
            'UPDATE tbluser SET password = $1 WHERE id = $2 RETURNING *',
            [hashedPassword, userId]
        ); // Update password in database

        res.status(200).json({ status: httpStatusText.SUCCESS, message: 'Password changed successfully', user: updatedUser.rows[0] }); // Send response
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: httpStatusText.FAILED, message: error.message });
    }
}


const updateUser = async (req, res) => {
    try {
        const { userId } = req.user; // Extract user_id from token
        const { firstname, lastname, country, currency, contact } = req.body; // Extract data from request body

        const userExist = await pool.query('SELECT * FROM tbluser WHERE id = $1', [userId]); // Check if user exists

        if (userExist.rows.length === 0) {
            return res.status(404).json({ status: httpStatusText.FAILED, message: 'User not found' });
        }

        const updatedUser = await pool.query(
            'UPDATE tbluser SET firstname = $1, lastname = $2, country = $3, currency = $4, contact = $5 , updatedat = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
            [firstname, lastname, country, currency, contact, userId]
        ); // Update user in database

        res.status(200).json({ status: httpStatusText.SUCCESS, message: 'User Information updated successfully', user: updatedUser.rows[0] }); // Send response
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: httpStatusText.FAILED, message: error.message });
    }
}


module.exports = {
    getUser,
    getUsers,
    changePassword,
    updateUser
}
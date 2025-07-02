const pool = require('../libs/db');
const httpStatusText = require('../utils/httpStatusText');
const dbIndex = require('../libs/index');

const getAccounts = async (req, res) => {
    try {
        const { userId } = req.user; // Extract user_id from token
        const accounts = await pool.query('SELECT * FROM tblaccount WHERE user_id = $1', [userId]); // Fetch all accounts for the user

        res.status(200).json({ status: httpStatusText.SUCCESS, accounts: accounts.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: httpStatusText.FAILED, message: error.message });
    }
}


const createAccount = async (req, res) => {
    try {
        const { userId } = req.user; // Extract user_id from token
        const { accountName, accountNumber, accountBalance } = req.body; // Extract data from request body

        // Check if account already exists
        const accountExistQuery = await pool.query('SELECT * FROM tblaccount WHERE account_number = $1 AND user_id = $2', [accountNumber, userId]);
        if (accountExistQuery.rows.length > 0) {
            return res.status(400).json({ status: httpStatusText.FAILED, message: 'Account number already created' });
        }

        // Create new account
        const createAccountResult = await pool.query('INSERT INTO tblaccount (user_id, account_name, account_number, account_balance) VALUES ($1, $2, $3, $4) RETURNING *',
            [userId, accountName, accountNumber, accountBalance]);
        const account = createAccountResult.rows[0]; // Get the created account

        const userAccounts = Array.isArray(accountName) ? accountName : [accountName]; // Ensure accountName is an array

        // Update user account list
        const updateUserAccountQuery = {
            text: `UPDATE tbluser SET accounts = array_cat(accounts , $1) , updatedAt = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
            values: [userAccounts, userId]
        }
        await pool.query(updateUserAccountQuery); // Execute update query

        const description = account.account_name + " account created successfully"; // Create description for transaction

        // Log transaction
        await pool.query(`INSERT INTO tbltransaction (user_id, description, type, status, amount , source) VALUES ($1, $2, $3, $4, $5 , $6) RETURNING *`,
            [userId, description, 'income', 'completed', accountBalance, account.account_name]);

        // Send response
        res.status(201).json({ status: httpStatusText.SUCCESS, message: account.account_name + 'Account created successfully', account });

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: httpStatusText.FAILED, message: error.message });
    }
}


const addMoneyToAccount = async (req, res) => {
    try {
        const { userId } = req.user; // Extract user_id from token
        const { id } = req.params; // Extract account ID from request parameters
        const { amount } = req.body; // Extract amount from request body

        const newAmount = Number(amount); // Convert amount to number

        if (isNaN(newAmount)) { // Check if amount is a number
            return res.status(400).json({ status: httpStatusText.FAILED, message: 'Invalid amount' });
        }

        // Start transaction
        await pool.query('BEGIN');

        // Update account balance
        const result = await pool.query('UPDATE tblaccount SET account_balance = (account_balance + $1) , updatedAt = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [newAmount, id]);

        const accountInfornation = result.rows[0]; // Get the updated account information

        const description = accountInfornation.account_name + "Deposit"; // Create description for transaction

        // Log transaction
        await pool.query(`INSERT INTO tbltransaction (user_id, description, type, status, amount , source) VALUES ($1, $2, $3, $4, $5 , $6) RETURNING *`,
            [userId, description, 'income', 'completed', amount, accountInfornation.account_name]);

        // Commit transaction
        await pool.query('COMMIT');

        // Send response
        res.status(200).json({ status: httpStatusText.SUCCESS, message: 'Operation completed successfully', account: accountInfornation });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: httpStatusText.FAILED, message: error.message });
    }
}


module.exports = {
    getAccounts,
    createAccount,
    addMoneyToAccount
}
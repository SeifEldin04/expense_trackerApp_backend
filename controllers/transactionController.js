const pool = require('../libs/db');
const httpStatusText = require('../utils/httpStatusText');
const dbIndex = require('../libs/index');

const getTransactions = async (req, res) => {
    try {
        const today = new Date();

        const _sevenDaysAgo = new Date(today);
        _sevenDaysAgo.setDate(today.getDate() - 7); // 7 days ago

        const sevenDaysAgo = _sevenDaysAgo.toISOString().split('T')[0]; // YYYY-MM-DD format

        const { df, dt, s } = req.query; // Get date [ df => date from, dt => date to, s => search string ]
        const { userId } = req.user; // Get userId from request object
        
        const search = s || '';

        const startDate = new Date(df || sevenDaysAgo); // Default to 7 days ago if no date is provided
        const endDate = new Date(dt || today); // Default to today if no date is provided

        const transactions = await pool.query(
            `SELECT * FROM tbltransaction
             WHERE user_id = $1
             AND createdAt BETWEEN $2 AND $3
             AND (description ILIKE '%' || $4 || '%'
             OR status ILIKE '%' || $4 || '%'
             OR source ILIKE '%' || $4 || '%')
             ORDER BY id DESC`,
            [userId, startDate, endDate, search]
        );

        res.status(200).json({
            status: httpStatusText.SUCCESS, message: 'Transactions retrieved successfully', data: transactions.rows,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: httpStatusText.FAILED, message: error.message });
    }
}


const getDashboardInformation = async (req, res) => {
    try {
        const { userId } = req.user; // Get userId from request object

        let totalIncome = 0; // Initialize total income
        let totalExpense = 0; // Initialize total expense

        const transactionResult = await pool.query(
            `SELECT type, SUM(amount) AS totalAmount FROM tbltransaction WHERE user_id = $1 GROUP BY type`,
            [userId]); // Get total income and expense
        const transactions = transactionResult.rows;

        transactions.forEach((transaction) => {
            if (transaction.type === 'income') {
                totalIncome += transaction.totalamount; // Add to total income
            } else {
                totalExpense += transaction.totalamount; // Add to total expense
            }
        });

        const availableBalance = totalIncome - totalExpense; // Calculate available balance

        // Aggregate transactions by month
        const year = new Date().getFullYear(); // Get current year
        const startDate = new Date(year, 0, 1); // Start date of the year
        const endDate = new Date(year, 11, 31, 23, 59, 59); // December 31st of the current year

        const result = await pool.query(
            `SELECT EXTRACT(MONTH FROM createdAt) AS month, type, SUM(amount) AS totalAmount 
            FROM tbltransaction WHERE user_id = $1 AND createdAt BETWEEN $2 AND $3 GROUP BY EXTRACT(MONTH FROM createdAt) , type`,
            [userId, startDate, endDate]
        );

        //organize data
        const data = new Array(12).fill().map((_, index) => {
            const monthData = result.rows.filter((item) => parseInt(item.month) === index + 1);

            const income = monthData.find((item) => item.type === 'income')?.totalamount || 0; // Get income for the month
            const expense = monthData.find((item) => item.type === 'expense')?.totalamount || 0; // Get expense for the month

            return {
                label: dbIndex.getMonthName(index), // Get month name
                income,
                expense,
            };
        })

        // Get last transactions
        const lastTransactionResult = await pool.query(
            `SELECT * FROM tbltransaction WHERE user_id = $1 ORDER BY id DESC LIMIT 5`,
            [userId]
        );
        const lastTransaction = lastTransactionResult.rows; // Get last transaction

        // Get last accounts
        const lastAccountResult = await pool.query(
            `SELECT * FROM tblaccount WHERE user_id = $1 ORDER BY id DESC LIMIT 4`,
            [userId]
        );
        const lastAccount = lastAccountResult.rows; // Get last account

        res.status(200).json({
            status: httpStatusText.SUCCESS,
            message: 'Dashboard information retrieved successfully',
            data: {
                availableBalance,
                totalIncome,
                totalExpense,
                chartData: data,
                lastTransaction,
                lastAccount,
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: httpStatusText.FAILED, message: error.message });
    }
}


const addTransaction = async (req, res) => {
    try {
        const { userId } = req.user;
        const { account_id } = req.params;
        const { description, source, amount } = req.body;

        if (!(description || source || amount)) { // Check if all fields are provided
            return res.status(400).json({ status: httpStatusText.FAILED, message: 'All fields are required' });
        }

        if (Number(amount) <= 0) { // Check if amount is greater than 0
            return res.status(400).json({ status: httpStatusText.FAILED, message: 'Amount must be greater than 0' });
        }

        const result = await pool.query('SELECT * FROM tblaccount WHERE id = $1', [account_id]); // Check if account exists
        const accountInfo = result.rows[0];

        if (!accountInfo) {
            return res.status(404).json({ status: httpStatusText.FAILED, message: 'Account not found' });
        }

        if (accountInfo.account_balance <= 0 || accountInfo.account_balance < Number(amount)) { // Check if account balance is sufficient
            return res.status(400).json({ status: httpStatusText.FAILED, message: 'Transaction Failed . Insufficient balance' });
        }

        await pool.query('BEGIN;'); // Start transaction

        await pool.query('UPDATE tblaccount SET account_balance = account_balance - $1 , updatedAt = CURRENT_TIMESTAMP WHERE id = $2',
            [amount, account_id]); // Deduct amount from account balance

        await pool.query('INSERT INTO tbltransaction (user_id, description, type, status, amount, source) VALUES ($1, $2, $3, $4, $5 , $6)',
            [userId, description, 'expense', 'completed', amount, source]); // Insert transaction record

        await pool.query('COMMIT;'); // Commit transaction

        res.status(200).json({
            status: httpStatusText.SUCCESS, message: 'Transaction completed successfully',
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: httpStatusText.FAILED, message: error.message });
    }
}


const transferMoneyToAccount = async (req, res) => {
    try {
        const { userId } = req.user;
        const { from_account, to_account, amount } = req.body;

        if (!(from_account && to_account && amount)) {
            return res.status(400).json({ status: httpStatusText.FAILED, message: 'All fields are required' });
        }

        const newAmount = Number(amount);
        if (newAmount <= 0) {
            return res.status(400).json({ status: httpStatusText.FAILED, message: 'Amount must be greater than 0' });
        }

        const fromAccountResult = await pool.query('SELECT * FROM tblaccount WHERE id = $1', [from_account]);
        const fromAccount = fromAccountResult.rows[0];

        if (!fromAccount) {
            return res.status(404).json({ status: httpStatusText.FAILED, message: 'From account not found' });
        }

        const toAccountResultCheck = await pool.query('SELECT * FROM tblaccount WHERE id = $1', [to_account]);
        const toAccountCheck = toAccountResultCheck.rows[0];

        if (!toAccountCheck) {
            return res.status(404).json({ status: httpStatusText.FAILED, message: 'To account not found' });
        }

        if (newAmount > fromAccount.account_balance) {
            return res.status(400).json({ status: httpStatusText.FAILED, message: 'Transaction Failed. Insufficient account balance' });
        }

        await pool.query('BEGIN');

        // Update sender
        await pool.query(
            'UPDATE tblaccount SET account_balance = account_balance - $1 , updatedAt = CURRENT_TIMESTAMP WHERE id = $2',
            [newAmount, from_account]
        );

        // Update receiver with RETURNING
        const toAccountResult = await pool.query(
            'UPDATE tblaccount SET account_balance = account_balance + $1 , updatedAt = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [newAmount, to_account]
        );
        const toAccountInfo = toAccountResult.rows[0];

        const transferDescription = `Transfer (${fromAccount.account_name} to ${toAccountInfo.account_name})`;
        const receiverDescription = `Received (${fromAccount.account_name} to ${toAccountInfo.account_name})`;

        // Log sender transaction
        await pool.query(
            'INSERT INTO tbltransaction (user_id, description, type, status, amount, source) VALUES ($1, $2, $3, $4, $5 , $6)',
            [userId, transferDescription, 'expense', 'completed', newAmount, fromAccount.account_name]
        );

        // Log receiver transaction
        await pool.query(
            'INSERT INTO tbltransaction (user_id, description, type, status, amount, source) VALUES ($1, $2, $3, $4, $5 , $6)',
            [userId, receiverDescription, 'income', 'completed', newAmount, toAccountInfo.account_name]
        );

        await pool.query('COMMIT');

        res.status(200).json({
            status: httpStatusText.SUCCESS,
            message: 'Transfer completed successfully',
        });

    } catch (error) {
        await pool.query('ROLLBACK');
        console.error(error);
        return res.status(500).json({ status: httpStatusText.FAILED, message: error.message });
    }
};


module.exports = {
    getTransactions,
    getDashboardInformation,
    addTransaction,
    transferMoneyToAccount,
};
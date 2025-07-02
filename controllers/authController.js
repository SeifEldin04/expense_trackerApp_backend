const httpStatusText = require('../utils/httpStatusText');
const pool = require('../libs/db');
require('dotenv').config();
const dbIndex = require('../libs/index');

const signupUser = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body; // Extract data from request body

        if ((!firstName || !email || !password)) { // Check if all fields are provided
            return res.status(400).json({ status: httpStatusText.FAILED, message: 'Please provide all fields' });
        }

        const userExist = await pool.query('SELECT id FROM tbluser WHERE email = $1', [email]); // Check if user already exists
        if (userExist.rows.length > 0) {
            return res.status(400).json({ status: httpStatusText.FAILED, message: 'Email already exists' });
        }

        const hashedPassword = await dbIndex.hashPassword(password); // Hash password
        if (!hashedPassword) {
            return res.status(500).json({ status: httpStatusText.FAILED, message: 'Error hashing password' });
        }

        const user = await pool.query(
            'INSERT INTO tbluser (firstName, lastName, email, password) VALUES ($1, $2, $3 , $4) RETURNING *',
            [firstName, lastName, email, hashedPassword]
        );

        // const token = await dbIndex.createJwt(user.rows[0].id); // Create JWT token for the user
        // user.rows[0].token = token; // Add token to user object

        user.rows[0].password = undefined; // Remove password from response

        res.status(201).json({ status: httpStatusText.SUCCESS, message: "User account created successfully", user: user.rows[0] });

    } catch (error) {
        console.log(error);
        res.status(500).json({ status: httpStatusText.FAILED, message: error.message });
    }
}


const signinUser = async (req, res) => {
    try {
        const { email, password } = req.body; // Extract data from request body

        const result = await pool.query('SELECT id, firstName, email, password FROM tbluser WHERE email = $1', [email]); // Check if user exists

        if (result.rows.length === 0) {
            return res.status(400).json({ status: httpStatusText.FAILED, message: 'Invalid credentials ( email or password )' });
        }

        const isMatch = await dbIndex.comparePassword(password, result.rows[0]?.password); // Compare password with hashed password
        if (!isMatch) {
            return res.status(400).json({ status: httpStatusText.FAILED, message: 'Invalid credentials ( email or password )' });
        }

        const token = await dbIndex.createJwt(result.rows[0].id); // Create JWT token for the user
        result.rows[0].password = undefined; // Remove password from response

        res.status(200).json({ status: httpStatusText.SUCCESS, message: "User logged in successfully", user: result.rows[0], token });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: httpStatusText.FAILED, message: error.message });
    }
}


module.exports = {
    signupUser,
    signinUser
};
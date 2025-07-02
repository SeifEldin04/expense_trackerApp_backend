require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    return hashedPassword;
}

const comparePassword = async (password, hashPassword) => {
    try {
        const isMatch = await bcrypt.compare(password, hashPassword);

        return isMatch;
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: httpStatusText.FAILED, message: error.message });
    }
}

const createJwt = async (id) => {
    return jwt.sign(
        { userId: id },
        process.env.JWT_SECRET_KEY,
        { expiresIn: '1d' }
    );
}

const getMonthName = (monthNumber) => {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNumber];
}

module.exports = {
    hashPassword,
    comparePassword,
    createJwt,
    getMonthName
};
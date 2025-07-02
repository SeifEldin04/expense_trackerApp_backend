const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ status: "Auth Failed", message: 'Unauthorized: No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.user = decoded;  // This will store the user information (like id, role) in req.user
        next();
    } catch (error) {
        return res.status(401).json({ status: "Auth Failed", message: 'Unauthorized: Invalid token' });
    }
};

module.exports = authenticate;
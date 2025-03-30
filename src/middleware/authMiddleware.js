const jwt = require("jsonwebtoken");
require("dotenv").config();

const authMiddleware = (req, res, next) => {
    const token = req.header("Authorization");
    if (!token) {
        return res.status(401).json({ message: "Access Denied: No token provided" });
    }

    try {
        const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
        req.user = decoded; // Attach user details to `req`
        next();
    } catch (err) {
        res.status(401).json({ message: "Invalid Token" });
    }
};

// ✅ Use CommonJS syntax instead of `export default`
module.exports = authMiddleware;

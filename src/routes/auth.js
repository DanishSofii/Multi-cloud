const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prismaClient");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const generateAccessToken = (user) => {
    return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "15m" });
};

const generateRefreshToken = (user) => {
    return jwt.sign({ id: user.id }, process.env.REFRESH_SECRET, { expiresIn: "7d" });
};

// Register
router.post("/register", async (req, res) => {
    const { email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { email, passwordHash: hashedPassword }
        });

        res.status(201).json({ message: "User registered successfully", user });
    } catch (error) {
        res.status(500).json({ message: "Error registering user", error });
    }
});

// Login
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        await prisma.refreshToken.create({
            data: {
              token: refreshToken,
              userId: user.id
            }
          });

        res.json({ accessToken, refreshToken });
    } catch (error) {
        res.status(500).json({ message: "Login failed", error });
    }
});

// Profile (Protected Route)
router.get("/profile", authMiddleware, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, email: true, createdAt: true }
        });

        if (!user) return res.status(404).json({ message: "User not found" });

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Error fetching profile", error });
    }
});

router.post('/refresh-token', async (req, res) => {
    const { refreshToken } = req.body;
    console.log("Received refresh token:", refreshToken);

    if (!refreshToken) {
        return res.status(400).json({ message: "Refresh token required" });
    }

    const storedToken = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });

    console.log("Stored token in DB:", storedToken);

    if (!storedToken) {
        return res.status(401).json({ message: "Invalid or expired refresh token" });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
        console.log("Decoded refresh token:", decoded);  // ✅ Debugging Line

        const newAccessToken = jwt.sign(
            { userId: decoded.id }, 
            process.env.ACCESS_SECRET, 
            { expiresIn: '15m' }
        );

        return res.json({ accessToken: newAccessToken });
    } catch (err) {
        console.error("JWT verification failed:", err.message);  // ✅ Log error
        return res.status(401).json({ message: "Invalid or expired refresh token" });
    }
});


  router.post("/logout", async (req, res) => {
    const { refreshToken } = req.body;
  
    if (!refreshToken) return res.status(401).json({ message: "Refresh token required" });
  
    try {
      await prisma.refreshToken.delete({ where: { token: refreshToken } });
  
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error logging out" });
    }
  });

module.exports = router;

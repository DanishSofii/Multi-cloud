const express = require("express");
const authMiddleware = require("../src/middleware/authMiddleware");

const router = express.Router();

// Example: Get user profile (protected)
router.get("/profile", authMiddleware, async (req, res) => {
    try {
        // req.user contains the user ID from the decoded token
        const user = await prisma.user.findUnique({ where: { id: req.user } });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ user });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;

const express = require("express");
const {getAuthURL, getAccessToken, listFiles} = require("../services/gdriveService.js");
const { uploadFileStriped, reconstructFile } = require("../services/storageService");
const router = express.Router();

// Get Google OAuth URL
router.get("/auth", (req, res) => {
    res.json({ authUrl: getAuthURL() });
});

// Handle OAuth callback
router.get("/callback", async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: "No code provided" });

    try {
        const tokens = await getAccessToken(code);
        res.json({ tokens });
    } catch (error) {
        res.status(500).json({ error: "Failed to get tokens" });
    }
});

// List Google Drive files
router.get("/files", async (req, res) => {
    try {
        const files = await listFiles();
        res.json({ files });
    } catch (error) {
        res.status(500).json({ error: "Failed to list files" });
    }
});

router.post("/token", async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) {
            return res.status(400).json({ message: "Authorization code is required" });
        }

        const tokens = await getAccessToken(code);
        res.json(tokens);
    } catch (error) {
        console.error("Error getting access token:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.post("/upload", async (req, res) => {
    const { userId, fileName, fileSize } = req.body;
    const chunkSize = 5 * 1024 * 1024; // 5MB chunks

    try {
        // Get all Google Drive accounts linked to the user
        const accounts = await prisma.cloudAuth.findMany({ where: { userId, provider: "gdrive" } });

        if (accounts.length === 0) {
            return res.status(400).json({ error: "No Google Drive accounts linked." });
        }

        // Fetch available storage for each drive
        const accountsWithStorage = await Promise.all(
            accounts.map(async (acc) => ({
                id: acc.id,
                availableSpace: await getAvailableStorage(acc.accessToken),
            }))
        );

        // Distribute file chunks
        const chunkAssignments = await distributeChunks(accountsWithStorage, fileSize, chunkSize);

        return res.json({ success: true, chunkAssignments });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: "File upload failed." });
    }
});

// Route to download and reconstruct a file
router.get("/download/:fileId", async (req, res) => {
    try {
        const fileId = parseInt(req.params.fileId);
        const filePartitions = await prisma.filePartitioning.findMany({ where: { fileId } });

        if (!filePartitions.length) return res.status(404).json({ error: "File not found" });

        const authAccounts = await prisma.cloudAuth.findMany();

        const outputFilePath = `downloads/reconstructed_file_${fileId}.bin`;
        await reconstructFile(filePartitions, authAccounts, outputFilePath);

        res.download(outputFilePath);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

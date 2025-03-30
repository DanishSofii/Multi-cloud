const express = require("express");
const { google } = require("googleapis");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.delete("/:fileId", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const { accessToken } = jwt.verify(token, process.env.JWT_SECRET);
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    await drive.files.delete({ fileId: req.params.fileId });

    res.json({ message: "File deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "File deletion failed" });
  }
});

module.exports = router;

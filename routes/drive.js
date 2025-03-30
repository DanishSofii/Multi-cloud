const express = require("express");
const { google } = require("googleapis");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.get("/files", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const { accessToken } = jwt.verify(token, process.env.JWT_SECRET);
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const drive = google.drive({ version: "v3", auth: oauth2Client });
    const response = await drive.files.list();
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch files" });
  }
});

module.exports = router;

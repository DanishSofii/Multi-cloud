const express = require("express");
const { google } = require("googleapis");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.get("/:fileId", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const { accessToken } = jwt.verify(token, process.env.JWT_SECRET);
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const fileId = req.params.fileId;
    const response = await drive.files.get({ fileId, alt: "media" }, { responseType: "stream" });

    res.setHeader("Content-Disposition", `attachment; filename="${fileId}"`);
    response.data.pipe(res);
  } catch (error) {
    res.status(500).json({ error: "File download failed" });
  }
});

module.exports = router;

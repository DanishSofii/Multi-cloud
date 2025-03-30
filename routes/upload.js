const express = require("express");
const multer = require("multer");
const { google } = require("googleapis");
const jwt = require("jsonwebtoken");
const fs = require("fs");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("file"), async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const { accessToken } = jwt.verify(token, process.env.JWT_SECRET);
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const fileMetadata = {
      name: req.file.originalname,
    };
    const media = {
      mimeType: req.file.mimetype,
      body: fs.createReadStream(req.file.path),
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id",
    });

    fs.unlinkSync(req.file.path); // Delete the file from local storage

    res.json({ fileId: response.data.id, message: "File uploaded successfully!" });
  } catch (error) {
    res.status(500).json({ error: "File upload failed" });
  }
});

module.exports = router;

const { google } = require("googleapis");
const fs = require("fs");

// Load credentials
const credentials = JSON.parse(fs.readFileSync("./src/gdrive_credentials.json"));

const { client_id, client_secret, redirect_uris } = credentials.installed;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

// Function to generate auth URL
const getAuthURL = () => {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: "offline",
        scope: ["https://www.googleapis.com/auth/drive"],
    });
    return authUrl;
};

// Function to get access token using auth code
const getAccessToken = async (code) => {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    return tokens;
};

// Function to list files
const listFiles = async () => {
    const drive = google.drive({ version: "v3", auth: oAuth2Client });
    const response = await drive.files.list();
    return response.data.files;
};

/**
 * Get available storage space for a Google Drive account.
 * @param {String} accessToken - The OAuth2 access token.
 * @returns {Number} - Available space in bytes.
 */
const getAvailableStorage = async (accessToken) => {
    try {
        const authClient = new google.auth.OAuth2();
        authClient.setCredentials({ access_token: accessToken });

        const drive = google.drive({ version: "v3", auth: authClient });
        const response = await drive.about.get({ fields: "storageQuota" });

        return response.data.storageQuota.limit - response.data.storageQuota.usage;
    } catch (error) {
        console.error("Error fetching available storage:", error);
        return 0;
    }
};

/**
 * Distribute file chunks across multiple Google Drive accounts.
 * @param {Array} accounts - List of Google Drive accounts with available space.
 * @param {Number} fileSize - Size of the file to upload.
 * @param {Number} chunkSize - Size of each file chunk.
 * @returns {Array} - Distribution plan (which chunk goes to which drive).
 */
const distributeChunks = async (accounts, fileSize, chunkSize) => {
    let chunkAssignments = [];
    let remainingSize = fileSize;
    let chunkIndex = 0;

    accounts.sort((a, b) => b.availableSpace - a.availableSpace); // Sort by space (descending)

    while (remainingSize > 0) {
        for (let account of accounts) {
            if (remainingSize <= 0) break;
            if (account.availableSpace >= chunkSize) {
                chunkAssignments.push({ chunkIndex, driveId: account.id });
                account.availableSpace -= chunkSize;
                remainingSize -= chunkSize;
                chunkIndex++;
            }
        }
    }

    return chunkAssignments;
};


module.exports = {
    getAuthURL,
    getAccessToken,
    listFiles,
    getAvailableStorage,
    distributeChunks,
};

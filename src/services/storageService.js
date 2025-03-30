const fs = require("fs");
const { getDriveSpace, uploadChunkToDrive } = require("./gdriveService");
const prisma = require("../../prisma/prismaClient");

// Function to prioritize Google Drive accounts based on available space
const prioritizeDrives = async (authAccounts) => {
    let driveSpaces = await Promise.all(authAccounts.map(async (auth) => {
        const space = await getDriveSpace(auth);
        return { auth, available: space.available };
    }));

    return driveSpaces.sort((a, b) => b.available - a.available); // Sort descending
};

// Function to split file into chunks and distribute across drives
const uploadFileStriped = async (filePath, authAccounts) => {
    const fileSize = fs.statSync(filePath).size;
    const chunkSize = 5 * 1024 * 1024; // Example: 5MB chunks

    let prioritizedDrives = await prioritizeDrives(authAccounts);
    let numDrives = prioritizedDrives.length;

    let chunks = [];
    let offset = 0;

    while (offset < fileSize) {
        let currentChunkSize = Math.min(chunkSize, fileSize - offset);
        let buffer = Buffer.alloc(currentChunkSize);
        
        const fd = fs.openSync(filePath, "r");
        fs.readSync(fd, buffer, 0, currentChunkSize, offset);
        fs.closeSync(fd);

        chunks.push({ buffer, drive: prioritizedDrives[offset % numDrives].auth });

        offset += currentChunkSize;
    }

    let uploadPromises = chunks.map(async ({ buffer, drive }, index) => {
        const uploadResult = await uploadChunkToDrive(buffer, drive, index);

        await prisma.filePartitioning.create({
            data: {
                chunkIndex: index,
                gdrivePartId: uploadResult.driveId,
                authId: drive.authId, // Store the CloudAuth ID from DB
            },
        });

        return uploadResult;
    });

    return await Promise.all(uploadPromises);
};

// Function to reconstruct a file by downloading and merging chunks
const reconstructFile = async (chunkIds, authAccounts, outputFilePath) => {
    const { google } = require("googleapis");
    const writeStream = fs.createWriteStream(outputFilePath);

    for (let { chunkIndex, driveId, auth } of chunkIds.sort((a, b) => a.chunkIndex - b.chunkIndex)) {
        const drive = google.drive({ version: "v3", auth });
        const res = await drive.files.get({ fileId: driveId, alt: "media" }, { responseType: "stream" });

        await new Promise((resolve) => {
            res.data.pipe(writeStream, { end: false });
            res.data.on("end", resolve);
        });
    }

    writeStream.end();
};

module.exports = {
    uploadFileStriped,
    reconstructFile,
};

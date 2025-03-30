const express = require('express');
const cors = require('cors');
// import gdriveRoutes from "./routes/gdrive.js";
const gdriveRoutes = require("./routes/gdrive"); // Ensure correct path
const authRoutes = require('./routes/auth'); // Ensure correct path

const app = express();
app.use(express.json()); // Required for parsing JSON body
app.use(cors());

// Routes
app.use('/api/auth', authRoutes);
app.use("/api/gdrive", gdriveRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

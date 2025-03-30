require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const driveRoutes = require("./routes/drive");
const uploadRoutes = require("./routes/upload");
const downloadRoutes = require("./routes/download");
const deleteRoutes = require("./routes/delete");
const profileRoutes = require("./routes/user");

const app = express();
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
    res.send("Multi-Cloud Storage Backend Running!");
});
app.use("/drive", driveRoutes);


app.use("/auth", authRoutes);
app.use("/upload", uploadRoutes);
app.use("/download", downloadRoutes);
app.use("/delete", deleteRoutes);
app.use("/profile", profileRoutes)

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

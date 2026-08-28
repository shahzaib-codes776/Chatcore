require("dotenv").config();
require("./src/config/db");
const express = require("express");
app.set("trust proxy", 1);
const cors = require("cors");
const authRoutes = require("./src/routes/authRoutes");
const businessRoutes = require("./src/routes/businessRoutes");
const chatRoutes = require("./src/routes/chatRoutes");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.json({ message: "ChatCore backend is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/chat", chatRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const dns = require("dns");

// Use public DNS servers for MongoDB Atlas SRV resolution
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const salonRoutes = require("./routes/salonRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const vendorRoutes = require("./routes/vendorRoutes");

dotenv.config();

const app = express();

// Connect MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/salons", salonRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/vendor", vendorRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "StyleFlow API is running successfully",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "StyleFlow backend is healthy",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`StyleFlow server running on http://localhost:${PORT}`);
});
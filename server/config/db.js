const dns = require("dns");

// Force Node.js to use public DNS servers for MongoDB Atlas SRV records
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error("MONGODB_URI is missing from .env");
    }

    console.log(
      "MongoDB URI format:",
      uri.startsWith("mongodb+srv://")
        ? "mongodb+srv:// detected"
        : uri.startsWith("mongodb://")
        ? "mongodb:// detected"
        : "INVALID URI FORMAT"
    );

    const conn = await mongoose.connect(uri, {
      family: 4,
    });

    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    throw error;
  }
};

module.exports = connectDB;
const express = require("express");

const {
  getVendorDashboard,
} = require("../controllers/vendorController");

const {
  protect,
  vendorOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/dashboard",
  protect,
  vendorOnly,
  getVendorDashboard
);

module.exports = router;
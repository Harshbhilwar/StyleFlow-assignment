const express = require("express");

const {
  getSalons,
  createSalon,
  getSalonById,
  getSalonServices,
  getSalonStylists,
  createStylist,
} = require("../controllers/salonController");

const {
  protect,
  vendorOnly,
} = require("../middleware/authMiddleware");

const router =
  express.Router();

// ==========================================
// PUBLIC ROUTES
// ==========================================

router.get(
  "/",
  getSalons
);

router.get(
  "/:id",
  getSalonById
);

router.get(
  "/:id/services",
  getSalonServices
);

router.get(
  "/:id/stylists",
  getSalonStylists
);

// ==========================================
// VENDOR ROUTES
// ==========================================

// Add new salon
router.post(
  "/",
  protect,
  vendorOnly,
  createSalon
);

// Add stylist to vendor's salon
router.post(
  "/:id/stylists",
  protect,
  vendorOnly,
  createStylist
);

module.exports = router;
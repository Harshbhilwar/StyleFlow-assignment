const express = require("express");

const {
  getAvailableSlots,
  createBooking,
  getMyBookings,
  cancelBooking,
} = require("../controllers/bookingController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Available slots can be viewed without login
router.get("/available-slots", getAvailableSlots);

// Customer booking routes
router.post("/", protect, createBooking);

router.get("/my-bookings", protect, getMyBookings);

router.patch("/:id/cancel", protect, cancelBooking);

module.exports = router;
const mongoose = require("mongoose");

const Booking = require("../models/Booking");
const Service = require("../models/Service");
const Stylist = require("../models/Stylist");
const Salon = require("../models/Salon");

// ==================================================
// HELPERS
// ==================================================

const timeToMinutes = (time) => {
  if (!time || typeof time !== "string") {
    return NaN;
  }

  const parts = time.split(":");

  if (parts.length !== 2) {
    return NaN;
  }

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return NaN;
  }

  return hours * 60 + minutes;
};

const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(
    2,
    "0"
  )}`;
};

const rangesOverlap = (startA, endA, startB, endB) => {
  return startA < endB && endA > startB;
};

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// ==================================================
// ROBUST STYLIST LOOKUP
// ==================================================

const findStylistForSalon = async (stylistId, salonId) => {
  try {
    const requestedStylistId = String(stylistId).trim();
    const requestedSalonId = String(salonId).trim();

    console.log("Stylist lookup:");
    console.log("Requested stylistId:", requestedStylistId);
    console.log("Requested salonId:", requestedSalonId);

    // Get all active stylists belonging to the selected salon.
    // We deliberately avoid findById() because the current
    // database is successfully returning these records by salon.
    const salonStylists = await Stylist.find({
      salon: requestedSalonId,
      isActive: true,
    });

    console.log(
      "Active stylists found for salon:",
      salonStylists.length
    );

    if (salonStylists.length === 0) {
      return {
        stylist: null,
        reason: "not_found",
      };
    }

    // Match ObjectId safely using Mongoose's equals().
    const stylist = salonStylists.find((item) => {
      if (item._id && typeof item._id.equals === "function") {
        return item._id.equals(requestedStylistId);
      }

      return String(item._id).trim() === requestedStylistId;
    });

    if (!stylist) {
      console.log(
        "Requested stylist was not found among salon stylists."
      );

      console.log(
        "Available stylist IDs:"
      );

      salonStylists.forEach((item) => {
        console.log(
          `${item.name}: ${String(item._id)}`
        );
      });

      return {
        stylist: null,
        reason: "not_found",
      };
    }

    console.log("Stylist lookup result: FOUND");

    console.log({
      id: String(stylist._id),
      name: stylist.name,
      salon: String(stylist.salon),
      isActive: stylist.isActive,
    });

    return {
      stylist,
      reason: "success",
    };
  } catch (error) {
    console.error(
      "Stylist lookup error:",
      error.message
    );

    return {
      stylist: null,
      reason: "error",
    };
  }
};

// ==================================================
// GET AVAILABLE SLOTS
// GET /api/bookings/available-slots
// ==================================================

const getAvailableSlots = async (req, res) => {
  try {
    let {
      salonId,
      serviceId,
      stylistId,
      bookingDate,
    } = req.query;

    salonId = salonId?.trim();
    serviceId = serviceId?.trim();
    stylistId = stylistId?.trim();
    bookingDate = bookingDate?.trim();

    console.log("\n========== AVAILABLE SLOTS ==========");
    console.log({
      salonId,
      serviceId,
      stylistId,
      bookingDate,
    });

    // --------------------------------------------------
    // REQUIRED INPUT
    // --------------------------------------------------

    if (!salonId || !serviceId || !stylistId || !bookingDate) {
      return res.status(400).json({
        success: false,
        message:
          "salonId, serviceId, stylistId and bookingDate are required",
      });
    }

    // --------------------------------------------------
    // ID VALIDATION
    // --------------------------------------------------

    if (
      !isValidObjectId(salonId) ||
      !isValidObjectId(serviceId) ||
      !isValidObjectId(stylistId)
    ) {
      return res.status(400).json({
        success: false,
        message: "One or more IDs are invalid",
      });
    }

    // --------------------------------------------------
    // SALON
    // --------------------------------------------------

    const salon = await Salon.findById(salonId);

    if (!salon || !salon.isActive) {
      return res.status(404).json({
        success: false,
        message: "Salon not found",
      });
    }

    // --------------------------------------------------
    // SERVICE
    // --------------------------------------------------

    const service = await Service.findById(serviceId);

    if (!service || !service.isActive) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    if (String(service.salon) !== String(salonId)) {
      return res.status(400).json({
        success: false,
        message: "Service does not belong to this salon",
      });
    }

    // --------------------------------------------------
    // STYLIST
    // --------------------------------------------------

    const stylistResult = await findStylistForSalon(
      stylistId,
      salonId
    );

    if (!stylistResult.stylist) {
      if (stylistResult.reason === "inactive") {
        return res.status(400).json({
          success: false,
          message: "Stylist is inactive",
        });
      }

      return res.status(404).json({
        success: false,
        message: "Stylist not found",
      });
    }

    const stylist = stylistResult.stylist;

    if (stylistResult.reason === "wrong_salon") {
      return res.status(400).json({
        success: false,
        message: "Stylist does not belong to this salon",
      });
    }

    // --------------------------------------------------
    // SERVICE TIME
    // --------------------------------------------------

    const serviceDuration = Number(service.duration);
    const bufferTime = Number(service.bufferTime || 0);

    const totalOccupiedMinutes =
      serviceDuration + bufferTime;

    if (
      Number.isNaN(serviceDuration) ||
      serviceDuration <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid service duration",
      });
    }

    // --------------------------------------------------
    // WORKING HOURS
    // --------------------------------------------------

    const workingStart = timeToMinutes(
      stylist.workingHours?.start
    );

    const workingEnd = timeToMinutes(
      stylist.workingHours?.end
    );

    if (
      Number.isNaN(workingStart) ||
      Number.isNaN(workingEnd) ||
      workingStart >= workingEnd
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid stylist working hours",
      });
    }

    // --------------------------------------------------
    // EXISTING BOOKINGS
    // --------------------------------------------------

    const allDateBookings = await Booking.find({
        bookingDate,
        status: {
            $in: ["pending", "confirmed"],
        },
    })
  .sort({
    startTime: 1,
  })
  .lean();

const existingBookings = allDateBookings.filter(
  (booking) =>
    String(booking.stylist).trim() ===
    String(stylist._id).trim()
);

console.log(
  "ALL ACTIVE BOOKINGS FOR DATE:",
  allDateBookings.map((booking) => ({
    id: String(booking._id),
    stylist: String(booking.stylist),
    date: booking.bookingDate,
    start: booking.startTime,
    end: booking.endTime,
    status: booking.status,
  }))
);

console.log(
  "EXISTING BOOKINGS FOR SELECTED STYLIST:",
  existingBookings.map((booking) => ({
    id: String(booking._id),
    stylist: String(booking.stylist),
    start: booking.startTime,
    end: booking.endTime,
    status: booking.status,
  }))
);

    const bookedRanges = existingBookings
      .map((booking) => ({
        start: timeToMinutes(booking.startTime),
        end: timeToMinutes(booking.endTime),
      }))
      .filter(
        (range) =>
          !Number.isNaN(range.start) &&
          !Number.isNaN(range.end)
      );

    // --------------------------------------------------
    // BREAKS
    // --------------------------------------------------

    const breakRanges = (stylist.breaks || [])
      .map((item) => ({
        start: timeToMinutes(item.start),
        end: timeToMinutes(item.end),
      }))
      .filter(
        (range) =>
          !Number.isNaN(range.start) &&
          !Number.isNaN(range.end)
      );

    // --------------------------------------------------
    // GENERATE SLOTS
    // --------------------------------------------------

    const slots = [];

    for (
      let start = workingStart;
      start + totalOccupiedMinutes <= workingEnd;
      start += 15
    ) {
      const occupiedEnd =
        start + totalOccupiedMinutes;

      // Existing booking conflict
      const bookingConflict = bookedRanges.some(
        (range) =>
          rangesOverlap(
            start,
            occupiedEnd,
            range.start,
            range.end
          )
      );

      if (bookingConflict) {
        continue;
      }

      // Break conflict
      const breakConflict = breakRanges.some(
        (range) =>
          rangesOverlap(
            start,
            occupiedEnd,
            range.start,
            range.end
          )
      );

      if (breakConflict) {
        continue;
      }

      const serviceEnd =
        start + serviceDuration;

      slots.push({
        startTime: minutesToTime(start),
        endTime: minutesToTime(serviceEnd),
        blockedUntil: minutesToTime(occupiedEnd),
        available: true,
      });
    }

    console.log(
      `Available slots generated: ${slots.length}`
    );

    return res.status(200).json({
      success: true,

      bookingDate,

      salon: {
        id: salon._id,
        name: salon.name,
        city: salon.city,
      },

      service: {
        id: service._id,
        name: service.name,
        category: service.category,
        duration: serviceDuration,
        bufferTime,
        price: service.price,
      },

      stylist: {
        id: stylist._id,
        name: stylist.name,
        specialization:
          stylist.specialization || [],
        experience: stylist.experience,
      },

      slots,

      totalAvailableSlots: slots.length,
    });
  } catch (error) {
    console.error(
      "Available slots error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to calculate available slots",
    });
  }
};

// ==================================================
// CREATE BOOKING
// POST /api/bookings
// ==================================================

const createBooking = async (req, res) => {
  try {
    let {
      salonId,
      serviceId,
      stylistId,
      bookingDate,
      startTime,
      notes,
    } = req.body;

    salonId = salonId?.trim();
    serviceId = serviceId?.trim();
    stylistId = stylistId?.trim();
    bookingDate = bookingDate?.trim();
    startTime = startTime?.trim();

    // --------------------------------------------------
    // REQUIRED INPUT
    // --------------------------------------------------

    if (
      !salonId ||
      !serviceId ||
      !stylistId ||
      !bookingDate ||
      !startTime
    ) {
      return res.status(400).json({
        success: false,
        message:
          "salonId, serviceId, stylistId, bookingDate and startTime are required",
      });
    }

    // --------------------------------------------------
    // AUTHENTICATION
    // --------------------------------------------------

    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // --------------------------------------------------
    // ID VALIDATION
    // --------------------------------------------------

    if (
      !isValidObjectId(salonId) ||
      !isValidObjectId(serviceId) ||
      !isValidObjectId(stylistId)
    ) {
      return res.status(400).json({
        success: false,
        message: "One or more IDs are invalid",
      });
    }

    // --------------------------------------------------
    // SALON
    // --------------------------------------------------

    const salon = await Salon.findById(salonId);

    if (!salon || !salon.isActive) {
      return res.status(404).json({
        success: false,
        message: "Salon not found",
      });
    }

    // --------------------------------------------------
    // SERVICE
    // --------------------------------------------------

    const service = await Service.findById(serviceId);

    if (!service || !service.isActive) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    if (String(service.salon) !== String(salonId)) {
      return res.status(400).json({
        success: false,
        message: "Service does not belong to this salon",
      });
    }

    // --------------------------------------------------
    // STYLIST
    // --------------------------------------------------

    const stylistResult = await findStylistForSalon(
      stylistId,
      salonId
    );

    if (!stylistResult.stylist) {
      if (stylistResult.reason === "inactive") {
        return res.status(400).json({
          success: false,
          message: "Stylist is inactive",
        });
      }

      return res.status(404).json({
        success: false,
        message: "Stylist not found",
      });
    }

    const stylist = stylistResult.stylist;

    if (stylistResult.reason === "wrong_salon") {
      return res.status(400).json({
        success: false,
        message: "Stylist does not belong to this salon",
      });
    }

    // --------------------------------------------------
    // START TIME
    // --------------------------------------------------

    const requestedStart =
      timeToMinutes(startTime);

    if (Number.isNaN(requestedStart)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid start time. Use HH:MM format",
      });
    }

    // --------------------------------------------------
    // DURATION
    // --------------------------------------------------

    const serviceDuration = Number(service.duration);
    const bufferTime = Number(
      service.bufferTime || 0
    );

    const requestedOccupiedEnd =
      requestedStart +
      serviceDuration +
      bufferTime;

    const actualServiceEnd =
      requestedStart +
      serviceDuration;

    // --------------------------------------------------
    // WORKING HOURS
    // --------------------------------------------------

    const workingStart = timeToMinutes(
      stylist.workingHours?.start
    );

    const workingEnd = timeToMinutes(
      stylist.workingHours?.end
    );

    if (
      requestedStart < workingStart ||
      requestedOccupiedEnd > workingEnd
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Selected slot is outside stylist working hours",
      });
    }

    // --------------------------------------------------
    // BREAK CONFLICT
    // --------------------------------------------------

    const breakConflict = (stylist.breaks || []).some(
      (item) => {
        const breakStart = timeToMinutes(item.start);
        const breakEnd = timeToMinutes(item.end);

        if (
          Number.isNaN(breakStart) ||
          Number.isNaN(breakEnd)
        ) {
          return false;
        }

        return rangesOverlap(
          requestedStart,
          requestedOccupiedEnd,
          breakStart,
          breakEnd
        );
      }
    );

    if (breakConflict) {
      return res.status(409).json({
        success: false,
        message:
          "Selected slot overlaps with stylist break",
      });
    }

    // --------------------------------------------------
    // BOOKING CONFLICT
    // --------------------------------------------------

    const allDateBookings = await Booking.find({
  bookingDate,
  status: {
    $in: ["pending", "confirmed"],
  },
}).lean();

const existingBookings = allDateBookings.filter(
  (booking) =>
    String(booking.stylist).trim() ===
    String(stylist._id).trim()
);

    const bookingConflict =
      existingBookings.some((booking) => {
        const existingStart =
          timeToMinutes(
            booking.startTime
          );

        const existingEnd =
          timeToMinutes(
            booking.endTime
          );

        if (
          Number.isNaN(existingStart) ||
          Number.isNaN(existingEnd)
        ) {
          return false;
        }

        return rangesOverlap(
          requestedStart,
          requestedOccupiedEnd,
          existingStart,
          existingEnd
        );
      });

    if (bookingConflict) {
      return res.status(409).json({
        success: false,
        message:
          "This stylist is already booked for the selected time",
      });
    }

    // --------------------------------------------------
    // CREATE BOOKING
    // --------------------------------------------------

    const booking = await Booking.create({
      customer: req.user.id,
      salon: salonId,
      service: serviceId,
      stylist: stylist._id,
      bookingDate,
      startTime,
      endTime: minutesToTime(actualServiceEnd),
      price: service.price,
      status: "confirmed",
      notes: notes || "",
    });

    // --------------------------------------------------
    // POPULATE BOOKING
    // --------------------------------------------------

    const populatedBooking =
      await Booking.findById(booking._id)
        .populate(
          "customer",
          "name email phone"
        )
        .populate(
          "salon",
          "name city address image"
        )
        .populate(
          "service",
          "name category price duration bufferTime"
        )
        .populate(
          "stylist",
          "name specialization experience image"
        );

    return res.status(201).json({
      success: true,
      message:
        "Appointment booked successfully",
      booking: populatedBooking,
    });
  } catch (error) {
    console.error(
      "Create booking error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create booking",
    });
  }
};

// ==================================================
// GET MY BOOKINGS
// GET /api/bookings/my-bookings
// ==================================================

const getMyBookings = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const bookings = await Booking.find({
      customer: req.user.id,
    })
      .populate(
        "salon",
        "name city address image"
      )
      .populate(
        "service",
        "name category price duration"
      )
      .populate(
        "stylist",
        "name specialization experience image"
      )
      .sort({
        bookingDate: -1,
        startTime: -1,
      });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error(
      "My bookings error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
    });
  }
};

// ==================================================
// CANCEL BOOKING
// PATCH /api/bookings/:id/cancel
// ==================================================

const cancelBooking = async (req, res) => {
  try {
    const bookingId =
      req.params.id?.trim();

    if (!isValidObjectId(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID",
      });
    }

    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const booking =
      await Booking.findOne({
        _id: bookingId,
        customer: req.user.id,
      });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message:
          "Booking is already cancelled",
      });
    }

    if (booking.status === "completed") {
      return res.status(400).json({
        success: false,
        message:
          "Completed bookings cannot be cancelled",
      });
    }

    booking.status = "cancelled";

    await booking.save();

    return res.status(200).json({
      success: true,
      message:
        "Booking cancelled successfully",
      booking,
    });
  } catch (error) {
    console.error(
      "Cancel booking error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to cancel booking",
    });
  }
};

// ==================================================
// EXPORTS
// ==================================================

module.exports = {
  getAvailableSlots,
  createBooking,
  getMyBookings,
  cancelBooking,
};
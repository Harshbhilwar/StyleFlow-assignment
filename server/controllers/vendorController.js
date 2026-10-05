const Salon = require("../models/Salon");
const Service = require("../models/Service");
const Stylist = require("../models/Stylist");
const Booking = require("../models/Booking");

const getVendorDashboard = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (req.user.role !== "vendor") {
      return res.status(403).json({
        success: false,
        message: "Vendor access required",
      });
    }

    const salons = await Salon.find({
      owner: req.user.id,
      isActive: true,
    }).lean();

    const salonIds = salons.map((salon) => salon._id);

    const [services, stylists, bookings] =
      await Promise.all([
        Service.find({
          salon: { $in: salonIds },
          isActive: true,
        })
          .sort({ createdAt: -1 })
          .lean(),

        Stylist.find({
          salon: { $in: salonIds },
          isActive: true,
        })
          .sort({ experience: -1 })
          .lean(),

        Booking.find({
          salon: { $in: salonIds },
        })
          .populate("customer", "name email phone")
          .populate("salon", "name city")
          .populate(
            "service",
            "name category price duration"
          )
          .populate(
            "stylist",
            "name specialization"
          )
          .sort({
            bookingDate: -1,
            startTime: -1,
          })
          .lean(),
      ]);

    const confirmedBookings = bookings.filter(
      (booking) =>
        booking.status === "confirmed"
    );

    const completedBookings = bookings.filter(
      (booking) =>
        booking.status === "completed"
    );

    const cancelledBookings = bookings.filter(
      (booking) =>
        booking.status === "cancelled"
    );

    const revenue = completedBookings.reduce(
      (total, booking) =>
        total + Number(booking.price || 0),
      0
    );

    res.status(200).json({
      success: true,

      stats: {
        salons: salons.length,
        services: services.length,
        stylists: stylists.length,
        totalBookings: bookings.length,
        confirmedBookings:
          confirmedBookings.length,
        completedBookings:
          completedBookings.length,
        cancelledBookings:
          cancelledBookings.length,
        revenue,
      },

      salons,
      services,
      stylists,

      recentBookings: bookings.slice(0, 10),
    });
  } catch (error) {
    console.error(
      "Vendor dashboard error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to load vendor dashboard",
    });
  }
};

module.exports = {
  getVendorDashboard,
};
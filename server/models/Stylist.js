const mongoose = require("mongoose");

const stylistSchema = new mongoose.Schema(
  {
    salon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Salon",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    specialization: [
      {
        type: String,
        trim: true,
      },
    ],

    experience: {
      type: Number,
      default: 0,
      min: 0,
    },

    phone: {
      type: String,
      trim: true,
    },

    image: {
      type: String,
      default:
        "https://images.unsplash.com/photo-1580618672591-eb180b1a973f",
    },

    workingHours: {
      start: {
        type: String,
        default: "10:00",
      },

      end: {
        type: String,
        default: "20:00",
      },
    },

    breaks: [
      {
        start: {
          type: String,
        },

        end: {
          type: String,
        },
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Stylist", stylistSchema);

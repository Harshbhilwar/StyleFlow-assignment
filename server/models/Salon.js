const mongoose = require("mongoose");

const salonSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    image: {
      type: String,
      default:
        "https://images.unsplash.com/photo-1560066984-138dadb4c035",
    },

    rating: {
      type: Number,
      default: 4.5,
      min: 0,
      max: 5,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Salon", salonSchema);

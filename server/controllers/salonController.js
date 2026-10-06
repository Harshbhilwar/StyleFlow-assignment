const mongoose = require("mongoose");

const Salon = require("../models/Salon");
const Service = require("../models/Service");
const Stylist = require("../models/Stylist");


const getSalons = async (req, res) => {
  try {
    const {
      search,
      city,
      minRating,
    } = req.query;

    const query = {
      isActive: true,
    };

    if (city) {
      query.city = {
        $regex: city,
        $options: "i",
      };
    }

    if (minRating) {
      query.rating = {
        $gte: Number(minRating),
      };
    }

    if (search) {
      query.$or = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          city: {
            $regex: search,
            $options: "i",
          },
        },
        {
          description: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const salons = await Salon.find(query)
      .populate(
        "owner",
        "name email"
      )
      .sort({
        rating: -1,
      });

    res.status(200).json({
      success: true,
      count: salons.length,
      salons,
    });
  } catch (error) {
    console.error(
      "Get salons error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch salons",
    });
  }
};



const createSalon = async (req, res) => {
  try {
    // Only vendors can create salons
    if (!req.user || req.user.role !== "vendor") {
      return res.status(403).json({
        success: false,
        message: "Vendor access required",
      });
    }

    const {
      name,
      description,
      address,
      city,
      phone,
      image,
      rating,
      serviceIds = [],
      stylistIds = [],
    } = req.body;

    
    if (!name || !address || !city) {
      return res.status(400).json({
        success: false,
        message: "Name, address and city are required",
      });
    }

    
    const selectedServiceIds = Array.isArray(serviceIds)
      ? [...new Set(serviceIds)]
      : [];

    const selectedStylistIds = Array.isArray(stylistIds)
      ? [...new Set(stylistIds)]
      : [];

    
    const invalidServiceIds = selectedServiceIds.some(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );

    const invalidStylistIds = selectedStylistIds.some(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );

    if (invalidServiceIds || invalidStylistIds) {
      return res.status(400).json({
        success: false,
        message: "One or more selected IDs are invalid",
      });
    }
    const vendorSalons = await Salon.find({
      owner: req.user.id,
      isActive: true,
    }).select("_id");

    const vendorSalonIds = vendorSalons.map(
      (salon) => salon._id
    );

    const sourceServices =
      selectedServiceIds.length > 0
        ? await Service.find({
            _id: {
              $in: selectedServiceIds,
            },
            salon: {
              $in: vendorSalonIds,
            },
            isActive: true,
          })
        : [];

    if (
      sourceServices.length !==
      selectedServiceIds.length
    ) {
      return res.status(400).json({
        success: false,
        message:
          "One or more selected services are unavailable",
      });
    }

    const sourceStylists =
      selectedStylistIds.length > 0
        ? await Stylist.find({
            _id: {
              $in: selectedStylistIds,
            },
            salon: {
              $in: vendorSalonIds,
            },
            isActive: true,
          })
        : [];

    if (
      sourceStylists.length !==
      selectedStylistIds.length
    ) {
      return res.status(400).json({
        success: false,
        message:
          "One or more selected stylists are unavailable",
      });
    }

    // CREATE NEW SALON
    const salon = await Salon.create({
      name: name.trim(),

      description:
        typeof description === "string"
          ? description.trim()
          : "",

      address: address.trim(),

      city: city.trim(),

      phone:
        typeof phone === "string"
          ? phone.trim()
          : "",

      image:
        typeof image === "string" &&
        image.trim()
          ? image.trim()
          : "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=80",

      rating:
        rating !== undefined && rating !== ""
          ? Number(rating)
          : 4.5,

      owner: req.user.id,

      isActive: true,
    });

    if (sourceServices.length > 0) {
      const servicesToCreate = sourceServices.map(
        (service) => {
          const serviceData = service.toObject();

          delete serviceData._id;
          delete serviceData.__v;
          delete serviceData.createdAt;
          delete serviceData.updatedAt;

          return {
            ...serviceData,
            salon: salon._id,
            isActive: true,
          };
        }
      );

      await Service.insertMany(servicesToCreate);
    }

    if (sourceStylists.length > 0) {
      const stylistsToCreate = sourceStylists.map(
        (stylist) => {
          const stylistData = stylist.toObject();

          delete stylistData._id;
          delete stylistData.__v;
          delete stylistData.createdAt;
          delete stylistData.updatedAt;

          return {
            ...stylistData,

            salon: salon._id,

            isActive: true,
          };
        }
      );

      await Stylist.insertMany(stylistsToCreate);
    }


    return res.status(201).json({
      success: true,
      message: "Salon created successfully",
      salon,
    });
  } catch (error) {
    console.error("Create salon error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create salon",
    });
  }
};


const getSalonById = async (
  req,
  res
) => {
  try {
    const salon =
      await Salon.findById(
        req.params.id
      ).populate(
        "owner",
        "name email"
      );

    if (
      !salon ||
      !salon.isActive
    ) {
      return res.status(404).json({
        success: false,
        message: "Salon not found",
      });
    }

    res.status(200).json({
      success: true,
      salon,
    });
  } catch (error) {
    console.error(
      "Get salon error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch salon",
    });
  }
};

const getSalonServices = async (
  req,
  res
) => {
  try {
    const services =
      await Service.find({
        salon: req.params.id,
        isActive: true,
      }).sort({
        category: 1,
        price: 1,
      });

    res.status(200).json({
      success: true,
      count: services.length,
      services,
    });
  } catch (error) {
    console.error(
      "Get salon services error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch salon services",
    });
  }
};

const getSalonStylists = async (
  req,
  res
) => {
  try {
    const stylists =
      await Stylist.find({
        salon: req.params.id,
        isActive: true,
      }).sort({
        experience: -1,
      });

    res.status(200).json({
      success: true,
      count: stylists.length,
      stylists,
    });
  } catch (error) {
    console.error(
      "Get salon stylists error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch salon stylists",
    });
  }
};

const createStylist = async (
  req,
  res
) => {
  try {
    if (
      !req.user ||
      req.user.role !== "vendor"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Vendor access required",
      });
    }

    const salonId =
      req.params.id;

    const {
      name,
      specialization,
      experience,
      phone,
      workingHours,
    } = req.body;

    if (!salonId || !name) {
      return res.status(400).json({
        success: false,
        message:
          "Salon and stylist name are required",
      });
    }

    
    const salon =
      await Salon.findOne({
        _id: salonId,
        owner: req.user.id,
        isActive: true,
      });

    if (!salon) {
      return res.status(404).json({
        success: false,
        message:
          "Salon not found or access denied",
      });
    }

    const stylist =
      await Stylist.create({
        salon: salon._id,

        name: name.trim(),

        specialization:
          Array.isArray(
            specialization
          )
            ? specialization
            : String(
                specialization || ""
              )
                .split(",")
                .map((item) =>
                  item.trim()
                )
                .filter(Boolean),

        experience: Number(
          experience || 0
        ),

        phone:
          phone?.trim() || "",

        workingHours: {
          start:
            workingHours?.start ||
            "10:00",

          end:
            workingHours?.end ||
            "20:00",
        },

        isActive: true,
      });

    res.status(201).json({
      success: true,
      message:
        "Stylist added successfully",
      stylist,
    });
  } catch (error) {
    console.error(
      "Create stylist error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to add stylist",
    });
  }
};

module.exports = {
  getSalons,
  createSalon,
  getSalonById,
  getSalonServices,
  getSalonStylists,
  createStylist,
};

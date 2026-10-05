const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

dotenv.config();

const connectDB = require("./config/db");

const User = require("./models/User");
const Salon = require("./models/Salon");
const Service = require("./models/Service");
const Stylist = require("./models/Stylist");
const Booking = require("./models/Booking");

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log("Clearing existing demo data...");

    await Booking.deleteMany({});
    await Stylist.deleteMany({});
    await Service.deleteMany({});
    await Salon.deleteMany({});

    // ==========================================
    // USERS
    // ==========================================

    const hashedPassword = await bcrypt.hash(
      "12345678",
      10
    );

    const customer = await User.findOneAndUpdate(
      { email: "customer@styleflow.com" },
      {
        name: "Demo Customer",
        email: "customer@styleflow.com",
        password: hashedPassword,
        role: "customer",
        phone: "9876543210",
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    const vendor = await User.findOneAndUpdate(
      { email: "vendor@styleflow.com" },
      {
        name: "StyleFlow Salon Owner",
        email: "vendor@styleflow.com",
        password: hashedPassword,
        role: "vendor",
        phone: "9876501234",
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    // ==========================================
    // SALONS
    // ==========================================

    const salons = await Salon.create([
      // -----------------------------
      // BENGALURU
      // -----------------------------
      {
        name: "Urban Cuts Studio",
        description:
          "Modern grooming studio offering professional haircuts, beard grooming and styling services.",
        address: "12 MG Road",
        city: "Bengaluru",
        phone: "9876501111",
        rating: 4.8,
        owner: vendor._id,
        image:
          "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=80",
      },
      {
        name: "Glow & Go Salon",
        description:
          "Premium beauty and wellness salon focused on personalized grooming experiences.",
        address: "45 Koramangala",
        city: "Bengaluru",
        phone: "9876502222",
        rating: 4.7,
        owner: vendor._id,
        image:
          "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1000&q=80",
      },
      {
        name: "The Style Lounge",
        description:
          "Contemporary salon offering hair styling, skincare and grooming services.",
        address: "18 Indiranagar",
        city: "Bengaluru",
        phone: "9876503333",
        rating: 4.6,
        owner: vendor._id,
        image:
          "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1000&q=80",
      },

      // -----------------------------
      // NEW DELHI
      // -----------------------------
      {
        name: "Urban Glow Studio",
        description:
          "Contemporary beauty studio offering premium hair, grooming and styling services.",
        address: "24 Greater Kailash",
        city: "New Delhi",
        phone: "9876504444",
        rating: 4.8,
        owner: vendor._id,
        image:
          "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=80",
      },
      {
        name: "Capital Style Lounge",
        description:
          "Premium salon focused on personalized styling and professional grooming experiences.",
        address: "32 Saket",
        city: "New Delhi",
        phone: "9876505555",
        rating: 4.7,
        owner: vendor._id,
        image:
          "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1000&q=80",
      },

      // -----------------------------
      // NOIDA
      // -----------------------------
      {
        name: "Noida Grooming Co.",
        description:
          "Modern grooming destination with professional haircuts, beard care and styling.",
        address: "Sector 18",
        city: "Noida",
        phone: "9876506666",
        rating: 4.8,
        owner: vendor._id,
        image:
          "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1000&q=80",
      },
      {
        name: "The Style Hub Noida",
        description:
          "Stylish neighbourhood salon offering hair, skincare and complete grooming services.",
        address: "Sector 62",
        city: "Noida",
        phone: "9876507777",
        rating: 4.6,
        owner: vendor._id,
        image:
          "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=1000&q=80",
      },

      // -----------------------------
      // PUNE
      // -----------------------------
      {
        name: "Pune Luxe Salon",
        description:
          "Elegant salon delivering premium styling, beauty treatments and grooming services.",
        address: "Koregaon Park",
        city: "Pune",
        phone: "9876508888",
        rating: 4.9,
        owner: vendor._id,
        image:
          "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?auto=format&fit=crop&w=1000&q=80",
      },
      {
        name: "Urban Trim Pune",
        description:
          "Modern grooming studio for professional haircuts, beard styling and personal care.",
        address: "Baner Road",
        city: "Pune",
        phone: "9876509999",
        rating: 4.7,
        owner: vendor._id,
        image:
          "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1000&q=80",
      },
    ]);

    // ==========================================
    // SERVICES
    // ==========================================

    const services = await Service.create([
      // ------------------------------------------
      // BENGALURU - Urban Cuts
      // ------------------------------------------
      {
        salon: salons[0]._id,
        name: "Classic Haircut",
        description:
          "Professional haircut with styling.",
        category: "Hair",
        price: 399,
        duration: 30,
        bufferTime: 10,
      },
      {
        salon: salons[0]._id,
        name: "Beard Grooming",
        description:
          "Beard trim, shaping and finishing.",
        category: "Beard",
        price: 249,
        duration: 30,
        bufferTime: 5,
      },
      {
        salon: salons[0]._id,
        name: "Hair Coloring",
        description:
          "Professional hair coloring service.",
        category: "Color",
        price: 999,
        duration: 90,
        bufferTime: 15,
      },

      // ------------------------------------------
      // BENGALURU - Glow & Go
      // ------------------------------------------
      {
        salon: salons[1]._id,
        name: "Hair Styling",
        description:
          "Professional styling for special occasions.",
        category: "Hair",
        price: 599,
        duration: 45,
        bufferTime: 10,
      },
      {
        salon: salons[1]._id,
        name: "Facial",
        description:
          "Relaxing facial and skincare treatment.",
        category: "Skin",
        price: 699,
        duration: 60,
        bufferTime: 10,
      },
      {
        salon: salons[1]._id,
        name: "Hair Spa",
        description:
          "Deep conditioning and scalp treatment.",
        category: "Hair Care",
        price: 799,
        duration: 60,
        bufferTime: 10,
      },

      // ------------------------------------------
      // BENGALURU - Style Lounge
      // ------------------------------------------
      {
        salon: salons[2]._id,
        name: "Premium Haircut",
        description:
          "Premium haircut with consultation and styling.",
        category: "Hair",
        price: 499,
        duration: 45,
        bufferTime: 10,
      },
      {
        salon: salons[2]._id,
        name: "Manicure",
        description:
          "Professional manicure treatment.",
        category: "Nails",
        price: 449,
        duration: 45,
        bufferTime: 10,
      },
      {
        salon: salons[2]._id,
        name: "Complete Grooming",
        description:
          "Haircut, beard grooming and styling package.",
        category: "Packages",
        price: 899,
        duration: 75,
        bufferTime: 15,
      },

      // ------------------------------------------
      // NEW DELHI - Urban Glow
      // ------------------------------------------
      {
        salon: salons[3]._id,
        name: "Signature Haircut",
        description:
          "Personalized haircut with professional styling.",
        category: "Hair",
        price: 449,
        duration: 30,
        bufferTime: 10,
      },
      {
        salon: salons[3]._id,
        name: "Beard Styling",
        description:
          "Premium beard shaping and finishing.",
        category: "Beard",
        price: 299,
        duration: 30,
        bufferTime: 5,
      },

      // ------------------------------------------
      // NEW DELHI - Capital Style
      // ------------------------------------------
      {
        salon: salons[4]._id,
        name: "Hair Styling",
        description:
          "Modern professional hair styling.",
        category: "Hair",
        price: 649,
        duration: 45,
        bufferTime: 10,
      },
      {
        salon: salons[4]._id,
        name: "Luxury Facial",
        description:
          "Premium skincare and facial treatment.",
        category: "Skin",
        price: 799,
        duration: 60,
        bufferTime: 10,
      },

      // ------------------------------------------
      // NOIDA - Grooming Co.
      // ------------------------------------------
      {
        salon: salons[5]._id,
        name: "Classic Haircut",
        description:
          "Clean professional haircut with styling.",
        category: "Hair",
        price: 349,
        duration: 30,
        bufferTime: 10,
      },
      {
        salon: salons[5]._id,
        name: "Beard Grooming",
        description:
          "Professional beard trim and styling.",
        category: "Beard",
        price: 229,
        duration: 30,
        bufferTime: 5,
      },

      // ------------------------------------------
      // NOIDA - Style Hub
      // ------------------------------------------
      {
        salon: salons[6]._id,
        name: "Premium Styling",
        description:
          "Professional styling experience.",
        category: "Styling",
        price: 599,
        duration: 45,
        bufferTime: 10,
      },
      {
        salon: salons[6]._id,
        name: "Hair Spa",
        description:
          "Relaxing scalp and hair treatment.",
        category: "Hair Care",
        price: 749,
        duration: 60,
        bufferTime: 10,
      },

      // ------------------------------------------
      // PUNE - Luxe Salon
      // ------------------------------------------
      {
        salon: salons[7]._id,
        name: "Luxury Haircut",
        description:
          "Premium consultation, haircut and styling.",
        category: "Hair",
        price: 499,
        duration: 45,
        bufferTime: 10,
      },
      {
        salon: salons[7]._id,
        name: "Skin Therapy",
        description:
          "Professional skincare treatment.",
        category: "Skin",
        price: 799,
        duration: 60,
        bufferTime: 10,
      },

      // ------------------------------------------
      // PUNE - Urban Trim
      // ------------------------------------------
      {
        salon: salons[8]._id,
        name: "Urban Haircut",
        description:
          "Modern haircut with personalized styling.",
        category: "Hair",
        price: 399,
        duration: 30,
        bufferTime: 10,
      },
      {
        salon: salons[8]._id,
        name: "Complete Grooming",
        description:
          "Haircut and beard grooming package.",
        category: "Packages",
        price: 699,
        duration: 60,
        bufferTime: 10,
      },
    ]);

    // ==========================================
    // STYLISTS
    // ==========================================

    const stylists = await Stylist.create([
      // Bengaluru
      {
        salon: salons[0]._id,
        name: "Rahul Sharma",
        specialization: [
          "Haircuts",
          "Fades",
          "Hair Styling",
        ],
        experience: 6,
        phone: "9876511111",
        workingHours: {
          start: "10:00",
          end: "20:00",
        },
        breaks: [
          {
            start: "13:30",
            end: "14:00",
          },
        ],
      },
      {
        salon: salons[0]._id,
        name: "Aman Verma",
        specialization: [
          "Beard",
          "Hair Coloring",
        ],
        experience: 5,
        phone: "9876511112",
        workingHours: {
          start: "10:00",
          end: "20:00",
        },
        breaks: [
          {
            start: "14:00",
            end: "14:30",
          },
        ],
      },

      {
        salon: salons[1]._id,
        name: "Neha Kapoor",
        specialization: [
          "Hair Styling",
          "Hair Spa",
        ],
        experience: 7,
        phone: "9876512221",
        workingHours: {
          start: "09:30",
          end: "19:30",
        },
        breaks: [
          {
            start: "13:00",
            end: "13:30",
          },
        ],
      },
      {
        salon: salons[1]._id,
        name: "Priya Singh",
        specialization: [
          "Facial",
          "Skin Care",
        ],
        experience: 5,
        phone: "9876512222",
        workingHours: {
          start: "10:00",
          end: "19:00",
        },
        breaks: [
          {
            start: "14:00",
            end: "14:30",
          },
        ],
      },

      {
        salon: salons[2]._id,
        name: "Arjun Mehta",
        specialization: [
          "Premium Haircuts",
          "Styling",
        ],
        experience: 8,
        phone: "9876513331",
        workingHours: {
          start: "10:00",
          end: "20:00",
        },
        breaks: [
          {
            start: "13:30",
            end: "14:00",
          },
        ],
      },
      {
        salon: salons[2]._id,
        name: "Riya Patel",
        specialization: [
          "Nails",
          "Grooming",
        ],
        experience: 6,
        phone: "9876513332",
        workingHours: {
          start: "10:30",
          end: "19:30",
        },
        breaks: [
          {
            start: "14:30",
            end: "15:00",
          },
        ],
      },

      // New Delhi
      {
        salon: salons[3]._id,
        name: "Aarav Malhotra",
        specialization: [
          "Haircuts",
          "Styling",
        ],
        experience: 7,
        phone: "9876521111",
        workingHours: {
          start: "10:00",
          end: "20:00",
        },
        breaks: [
          {
            start: "13:30",
            end: "14:00",
          },
        ],
      },
      {
        salon: salons[3]._id,
        name: "Simran Kaur",
        specialization: [
          "Hair Styling",
          "Beauty",
        ],
        experience: 6,
        phone: "9876521112",
        workingHours: {
          start: "10:00",
          end: "20:00",
        },
        breaks: [
          {
            start: "14:00",
            end: "14:30",
          },
        ],
      },

      {
        salon: salons[4]._id,
        name: "Kabir Arora",
        specialization: [
          "Styling",
          "Haircuts",
        ],
        experience: 8,
        phone: "9876522221",
        workingHours: {
          start: "09:30",
          end: "19:30",
        },
        breaks: [
          {
            start: "13:00",
            end: "13:30",
          },
        ],
      },
      {
        salon: salons[4]._id,
        name: "Ananya Gupta",
        specialization: [
          "Facial",
          "Skin Care",
        ],
        experience: 5,
        phone: "9876522222",
        workingHours: {
          start: "10:00",
          end: "19:00",
        },
        breaks: [
          {
            start: "14:00",
            end: "14:30",
          },
        ],
      },

      // Noida
      {
        salon: salons[5]._id,
        name: "Rohit Yadav",
        specialization: [
          "Haircuts",
          "Fades",
        ],
        experience: 6,
        phone: "9876523331",
        workingHours: {
          start: "10:00",
          end: "20:00",
        },
        breaks: [
          {
            start: "13:30",
            end: "14:00",
          },
        ],
      },
      {
        salon: salons[5]._id,
        name: "Vikas Singh",
        specialization: [
          "Beard",
          "Styling",
        ],
        experience: 5,
        phone: "9876523332",
        workingHours: {
          start: "10:00",
          end: "20:00",
        },
        breaks: [
          {
            start: "14:00",
            end: "14:30",
          },
        ],
      },

      {
        salon: salons[6]._id,
        name: "Karan Sharma",
        specialization: [
          "Styling",
          "Hair Spa",
        ],
        experience: 7,
        phone: "9876524441",
        workingHours: {
          start: "10:00",
          end: "20:00",
        },
        breaks: [
          {
            start: "13:30",
            end: "14:00",
          },
        ],
      },
      {
        salon: salons[6]._id,
        name: "Meera Kapoor",
        specialization: [
          "Hair Care",
          "Styling",
        ],
        experience: 6,
        phone: "9876524442",
        workingHours: {
          start: "10:00",
          end: "19:30",
        },
        breaks: [
          {
            start: "14:00",
            end: "14:30",
          },
        ],
      },

      // Pune
      {
        salon: salons[7]._id,
        name: "Aditya Joshi",
        specialization: [
          "Premium Haircuts",
          "Styling",
        ],
        experience: 8,
        phone: "9876525551",
        workingHours: {
          start: "10:00",
          end: "20:00",
        },
        breaks: [
          {
            start: "13:30",
            end: "14:00",
          },
        ],
      },
      {
        salon: salons[7]._id,
        name: "Ishita Shah",
        specialization: [
          "Beauty",
          "Skin Care",
        ],
        experience: 7,
        phone: "9876525552",
        workingHours: {
          start: "10:00",
          end: "20:00",
        },
        breaks: [
          {
            start: "14:00",
            end: "14:30",
          },
        ],
      },

      {
        salon: salons[8]._id,
        name: "Manav Kulkarni",
        specialization: [
          "Haircuts",
          "Grooming",
        ],
        experience: 6,
        phone: "9876526661",
        workingHours: {
          start: "10:00",
          end: "20:00",
        },
        breaks: [
          {
            start: "13:30",
            end: "14:00",
          },
        ],
      },
      {
        salon: salons[8]._id,
        name: "Sneha Patil",
        specialization: [
          "Styling",
          "Grooming",
        ],
        experience: 5,
        phone: "9876526662",
        workingHours: {
          start: "10:30",
          end: "19:30",
        },
        breaks: [
          {
            start: "14:30",
            end: "15:00",
          },
        ],
      },
    ]);

    // ==========================================
    // DEMO EXISTING BOOKING
    // ==========================================

    const firstService = services[0];
    const firstStylist = stylists[0];

    const tomorrow = new Date();

    tomorrow.setDate(
      tomorrow.getDate() + 1
    );

    const bookingDate =
      tomorrow.toISOString().split("T")[0];

    await Booking.create({
      customer: customer._id,
      salon: salons[0]._id,
      service: firstService._id,
      stylist: firstStylist._id,
      bookingDate,
      startTime: "12:00",
      endTime: "12:30",
      price: firstService.price,
      status: "confirmed",
      notes:
        "Demo existing booking for availability testing",
    });

    // ==========================================
    // SUMMARY
    // ==========================================

    console.log("");
    console.log(
      "======================================"
    );
    console.log(
      "StyleFlow database seeded successfully"
    );
    console.log(
      "======================================"
    );

    console.log(
      `Salons created: ${salons.length}`
    );

    console.log(
      `Services created: ${services.length}`
    );

    console.log(
      `Stylists created: ${stylists.length}`
    );

    console.log(
      `Demo booking date: ${bookingDate}`
    );

    console.log("");
    console.log("Locations:");
    console.log("- Bengaluru");
    console.log("- New Delhi");
    console.log("- Noida");
    console.log("- Pune");

    console.log("");
    console.log("Demo Customer:");
    console.log(
      "Email: customer@styleflow.com"
    );
    console.log("Password: 12345678");

    console.log("");
    console.log("Demo Vendor:");
    console.log(
      "Email: vendor@styleflow.com"
    );
    console.log("Password: 12345678");

    console.log(
      "======================================"
    );

    await mongoose.connection.close();

    process.exit(0);
  } catch (error) {
    console.error(
      "Database seed error:",
      error
    );

    process.exit(1);
  }
};

seedDatabase();
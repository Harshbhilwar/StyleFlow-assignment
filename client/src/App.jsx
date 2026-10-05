import { useEffect, useMemo, useState } from "react";
import VendorDashboard from "./VendorDashboard";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const demoSalons = [
  {
    _id: "demo-1",
    name: "Urban Cuts Studio",
    city: "Bengaluru",
    address: "12 MG Road",
    rating: 4.8,
    description:
      "Modern grooming studio offering professional haircuts, beard grooming and styling services.",
    image:
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=80",
  },
  {
    _id: "demo-2",
    name: "Glow & Go Salon",
    city: "Bengaluru",
    address: "45 Koramangala",
    rating: 4.7,
    description:
      "Premium beauty and wellness salon focused on personalized grooming experiences.",
    image:
      "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=900&q=80",
  },
  {
    _id: "demo-3",
    name: "The Style Lounge",
    city: "Bengaluru",
    address: "18 Indiranagar",
    rating: 4.6,
    description:
      "Contemporary salon offering hair styling, skincare and grooming services.",
    image:
      "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=900&q=80",
  },
];

function App() {
  const [view, setView] = useState("home");

  const [salons, setSalons] = useState([]);
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [services, setServices] = useState([]);
  const [stylists, setStylists] = useState([]);

  const [selectedService, setSelectedService] = useState(null);
  const [selectedStylist, setSelectedStylist] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [myBookings, setMyBookings] = useState([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [slotLoading, setSlotLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [authMode, setAuthMode] = useState("login");

  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "customer",
  });

  const token = localStorage.getItem("styleflow_token");

  const loggedUser = useMemo(() => {
    try {
      return JSON.parse(
        localStorage.getItem("styleflow_user")
      );
    } catch {
      return null;
    }
  }, [token]);

  // --------------------------------------------------
  // API helper
  // --------------------------------------------------

  const apiRequest = async (
    endpoint,
    options = {}
  ) => {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
      `${API_URL}${endpoint}`,
      {
        ...options,
        headers,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Something went wrong"
      );
    }

    return data;
  };

  // --------------------------------------------------
  // Fetch salons
  // --------------------------------------------------

  const fetchSalons = async (searchValue = "") => {
    try {
      setLoading(true);
      setError("");

      const endpoint = searchValue
        ? `/salons?search=${encodeURIComponent(
            searchValue
          )}`
        : "/salons";

      const data = await apiRequest(endpoint);

      setSalons(
        data.salons?.length
          ? data.salons
          : demoSalons
      );
    } catch (err) {
      setError(err.message);
      setSalons(demoSalons);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalons();
  }, []);

  // --------------------------------------------------
  // Search
  // --------------------------------------------------

  const handleSearch = async (e) => {
    e.preventDefault();
    await fetchSalons(search);
    setView("salons");
  };

  // --------------------------------------------------
  // Open salon
  // --------------------------------------------------

  const openSalon = async (salon) => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      setSelectedSalon(salon);

      const [serviceData, stylistData] =
        await Promise.all([
          apiRequest(
            `/salons/${salon._id}/services`
          ),
          apiRequest(
            `/salons/${salon._id}/stylists`
          ),
        ]);

      setServices(serviceData.services || []);
      setStylists(stylistData.stylists || []);

      setSelectedService(null);
      setSelectedStylist(null);
      setSelectedDate("");
      setSlots([]);
      setSelectedSlot(null);

      setView("details");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Check available slots
  // --------------------------------------------------

  const checkAvailability = async () => {
    if (
      !selectedSalon ||
      !selectedService ||
      !selectedStylist ||
      !selectedDate
    ) {
      setError(
        "Please select a service, stylist and date."
      );
      return;
    }

    try {
      setSlotLoading(true);
      setError("");
      setMessage("");
      setSlots([]);
      setSelectedSlot(null);

      const params = new URLSearchParams({
        salonId: selectedSalon._id,
        serviceId: selectedService._id,
        stylistId: selectedStylist._id,
        bookingDate: selectedDate,
      });

      const data = await apiRequest(
        `/bookings/available-slots?${params}`
      );

      setSlots(data.slots || []);

      if (!data.slots?.length) {
        setMessage(
          "No available slots for this date."
        );
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSlotLoading(false);
    }
  };

  // --------------------------------------------------
  // Book appointment
  // --------------------------------------------------

  const bookAppointment = async () => {
    if (!token) {
      setAuthMode("login");
      setView("auth");
      setError(
        "Please login before booking an appointment."
      );
      return;
    }

    if (!selectedSlot) {
      setError("Please select an available slot.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const data = await apiRequest("/bookings", {
        method: "POST",
        body: JSON.stringify({
          salonId: selectedSalon._id,
          serviceId: selectedService._id,
          stylistId: selectedStylist._id,
          bookingDate: selectedDate,
          startTime: selectedSlot.startTime,
          notes: "Booked through StyleFlow",
        }),
      });

      setMessage(
        `Appointment confirmed for ${selectedDate} at ${selectedSlot.startTime}.`
      );

      setSelectedSlot(null);

      await loadMyBookings();

      setTimeout(() => {
        setView("bookings");
      }, 800);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Load bookings
  // --------------------------------------------------

  const loadMyBookings = async () => {
    if (!token) {
      setView("auth");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await apiRequest(
        "/bookings/my-bookings"
      );

      setMyBookings(data.bookings || []);
      setView("bookings");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Cancel booking
  // --------------------------------------------------

  const cancelBooking = async (bookingId) => {
    try {
      setLoading(true);
      setError("");

      await apiRequest(
        `/bookings/${bookingId}/cancel`,
        {
          method: "PATCH",
        }
      );

      setMessage("Booking cancelled successfully.");

      await loadMyBookings();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Authentication
  // --------------------------------------------------

  const handleAuthSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const endpoint =
        authMode === "login"
          ? "/auth/login"
          : "/auth/register";

      const body =
        authMode === "login"
          ? {
              email: authForm.email,
              password: authForm.password,
            }
          : authForm;

      const data = await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });

      localStorage.setItem(
        "styleflow_token",
        data.token
      );

      localStorage.setItem(
        "styleflow_user",
        JSON.stringify(data.user)
      );

      setMessage(
        authMode === "login"
          ? "Login successful."
          : "Registration successful."
      );

      if (data.user?.role?.toLowerCase() === "vendor") {
        setView("vendor");
      } else {
         setView("home");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Logout
  // --------------------------------------------------

  const logout = () => {
    localStorage.removeItem("styleflow_token");
    localStorage.removeItem("styleflow_user");

    setMyBookings([]);
    setView("home");
    setMessage("Logged out successfully.");
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="app">
      <nav className="navbar">
        <div
          className="brand"
          onClick={() => setView("home")}
        >
          <span className="brand-mark">S</span>
          <span>StyleFlow</span>
        </div>

        <div className="nav-links">
          <button
            onClick={() => setView("home")}
          >
            Home
          </button>

          <button
            onClick={() => {
              setView("salons");
              fetchSalons();
            }}
          >
            Explore
          </button>

          {token && (
            <button onClick={loadMyBookings}>
              My Bookings
            </button>
          )}

          {loggedUser?.role?.toLowerCase() === "vendor" && (
            <button
            className="nav-primary"
            onClick={() => setView("vendor")}
            >
               Vendor Dashboard
           </button>
          )}

          {token ? (
            <>
              <span className="user-pill">
                Hi, {loggedUser?.name || "User"}
              </span>

              <button
                className="nav-outline"
                onClick={logout}
              >
                Logout
              </button>
            </>
          ) : (
            <button
              className="nav-primary"
              onClick={() => {
                setAuthMode("login");
                setView("auth");
              }}
            >
              Login
            </button>
          )}
        </div>
      </nav>

      {error && (
        <div className="alert error-alert">
          {error}
          <button onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}

      {message && (
        <div className="alert success-alert">
          {message}
          <button onClick={() => setMessage("")}>
            ×
          </button>
        </div>
      )}

      {/* ==========================================
          HOME
      ========================================== */}

      {view === "home" && (
        <main>
          <section className="hero">
            <div className="hero-content">
              <span className="eyebrow">
                SMART SALON BOOKING
              </span>

              <h1>
                Your style.
                <br />
                Your time.
                <br />
                <span>One simple booking.</span>
              </h1>

              <p>
                Discover trusted salons, choose your
                stylist and book a time that actually
                works.
              </p>

              <form
                className="search-box"
                onSubmit={handleSearch}
              >
                <span>⌕</span>

                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search salons or locations..."
                />

                <button type="submit">
                  Search
                </button>
              </form>

              <div className="hero-stats">
                <div>
                  <strong>9+</strong>
                  <span>Salons</span>
                </div>

                <div>
                  <strong>21+</strong>
                  <span>Services</span>
                </div>

                <div>
                  <strong>18+</strong>
                  <span>Stylists</span>
                </div>
              </div>
            </div>

            <div className="hero-visual">
              <div className="hero-image-card">
                <img
                  src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1100&q=85"
                  alt="Modern salon"
                />

                <div className="floating-card">
                  <span className="floating-icon">
                    ✓
                  </span>

                  <div>
                    <strong>
                      Smart availability
                    </strong>

                    <small>
                      Real-time slot validation
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  DISCOVER
                </span>

                <h2>
                  Popular salons
                </h2>
              </div>

              <button
                className="text-button"
                onClick={() => setView("salons")}
              >
                View all →
              </button>
            </div>

            <div className="salon-grid">
              {salons.slice(0, 3).map((salon) => (
                <SalonCard
                  key={salon._id}
                  salon={salon}
                  onClick={() =>
                    openSalon(salon)
                  }
                />
              ))}
            </div>
          </section>
        </main>
      )}

      {/* ==========================================
          SALON LIST
      ========================================== */}

      {view === "salons" && (
        <main className="page">
          <section className="page-header">
            <span className="eyebrow">
              EXPLORE
            </span>

            <h1>Find your perfect salon</h1>

            <p>
              Search trusted salons and choose the
              service and stylist that suits you.
            </p>

            <form
              className="search-box compact"
              onSubmit={handleSearch}
            >
              <span>⌕</span>

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search by salon or city..."
              />

              <button type="submit">
                Search
              </button>
            </form>
          </section>

          {loading ? (
            <div className="loading">
              Loading salons...
            </div>
          ) : (
            <div className="salon-grid">
              {salons.map((salon) => (
                <SalonCard
                  key={salon._id}
                  salon={salon}
                  onClick={() =>
                    openSalon(salon)
                  }
                />
              ))}
            </div>
          )}
        </main>
      )}

      {/* ==========================================
          SALON DETAILS
      ========================================== */}

      {view === "details" &&
        selectedSalon && (
          <main className="page">
            <button
              className="back-button"
              onClick={() =>
                setView("salons")
              }
            >
              ← Back to salons
            </button>

            <section className="detail-hero">
              <img
                src={selectedSalon.image}
                alt={selectedSalon.name}
              />

              <div>
                <span className="rating">
                  ★ {selectedSalon.rating}
                </span>

                <h1>
                  {selectedSalon.name}
                </h1>

                <p>
                  {selectedSalon.description}
                </p>

                <span className="muted">
                  📍 {selectedSalon.address},{" "}
                  {selectedSalon.city}
                </span>
              </div>
            </section>

            <section className="booking-panel">
              <div className="booking-column">
                <div className="step-label">
                  <span>01</span>
                  Choose a service
                </div>

                <div className="option-list">
                  {services.map((service) => (
                    <button
                      key={service._id}
                      className={`option-card ${
                        selectedService?._id ===
                        service._id
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        setSelectedService(
                          service
                        )
                      }
                    >
                      <div>
                        <strong>
                          {service.name}
                        </strong>

                        <small>
                          {service.category} ·{" "}
                          {service.duration} min
                        </small>
                      </div>

                      <span>
                        ₹{service.price}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="booking-column">
                <div className="step-label">
                  <span>02</span>
                  Choose a stylist
                </div>

                <div className="stylist-list">
                  {stylists.map((stylist) => (
                    <button
                      key={stylist._id}
                      className={`stylist-card ${
                        selectedStylist?._id ===
                        stylist._id
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        setSelectedStylist(
                          stylist
                        )
                      }
                    >
                      <div className="avatar">
                        {stylist.name
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>
                        <strong>
                          {stylist.name}
                        </strong>

                        <small>
                          {stylist.experience} years
                          experience
                        </small>
                      </div>

                      <span>›</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="booking-column full-width">
                <div className="step-label">
                  <span>03</span>
                  Choose date
                </div>

                <input
                  className="date-input"
                  type="date"
                  value={selectedDate}
                  min={
                    new Date()
                      .toISOString()
                      .split("T")[0]
                  }
                  onChange={(e) =>
                    setSelectedDate(
                      e.target.value
                    )
                  }
                />

                <button
                  className="primary-button"
                  onClick={
                    checkAvailability
                  }
                  disabled={slotLoading}
                >
                  {slotLoading
                    ? "Checking..."
                    : "Check Available Times"}
                </button>
              </div>

              {slots.length > 0 && (
                <div className="booking-column full-width">
                  <div className="step-label">
                    <span>04</span>
                    Available time slots
                  </div>

                  <p className="slot-info">
                    Choose a time that works for
                    your selected stylist.
                  </p>

                  <div className="slot-grid">
                    {slots.map((slot) => (
                      <button
                        key={`${slot.startTime}-${slot.endTime}`}
                        className={`slot ${
                          selectedSlot?.startTime ===
                          slot.startTime
                            ? "selected"
                            : ""
                        }`}
                        onClick={() =>
                          setSelectedSlot(slot)
                        }
                      >
                        {formatTime(
                          slot.startTime
                        )}
                      </button>
                    ))}
                  </div>

                  {selectedSlot && (
                    <div className="confirmation-bar">
                      <div>
                        <small>
                          Selected appointment
                        </small>

                        <strong>
                          {formatTime(
                            selectedSlot.startTime
                          )}{" "}
                          · {selectedService?.name}
                        </strong>
                      </div>

                      <button
                        className="primary-button"
                        onClick={
                          bookAppointment
                        }
                        disabled={loading}
                      >
                        {loading
                          ? "Booking..."
                          : "Confirm Booking"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>
          </main>
        )}

      {/* ==========================================
          BOOKINGS
      ========================================== */}

      {view === "bookings" && (
        <main className="page">
          <section className="page-header left">
            <span className="eyebrow">
              ACCOUNT
            </span>

            <h1>My bookings</h1>

            <p>
              Keep track of your upcoming and past
              appointments.
            </p>
          </section>

          {myBookings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                ✦
              </div>

              <h3>No bookings yet</h3>

              <p>
                Find a salon and schedule your first
                appointment.
              </p>

              <button
                className="primary-button"
                onClick={() =>
                  setView("salons")
                }
              >
                Explore salons
              </button>
            </div>
          ) : (
            <div className="booking-list">
              {myBookings.map((booking) => (
                <article
                  className="booking-card"
                  key={booking._id}
                >
                  <div className="booking-date">
                    <strong>
                      {formatDate(
                        booking.bookingDate
                      )}
                    </strong>

                    <span>
                      {formatTime(
                        booking.startTime
                      )}
                    </span>
                  </div>

                  <div className="booking-main">
                    <h3>
                      {booking.salon?.name}
                    </h3>

                    <p>
                      {booking.service?.name} with{" "}
                      {booking.stylist?.name}
                    </p>

                    <span className="muted">
                      {booking.salon?.city}
                    </span>
                  </div>

                  <div className="booking-price">
                    <strong>
                      ₹{booking.price}
                    </strong>

                    <span
                      className={`status ${booking.status}`}
                    >
                      {booking.status}
                    </span>
                  </div>

                  {booking.status !==
                    "cancelled" &&
                    booking.status !==
                      "completed" && (
                      <button
                        className="cancel-button"
                        onClick={() =>
                          cancelBooking(
                            booking._id
                          )
                        }
                      >
                        Cancel
                      </button>
                    )}
                </article>
              ))}
            </div>
          )}
        </main>
      )}

      {view === "vendor" && (
        <VendorDashboard
          onBack={() => setView("home")}
        />
    )}

      {/* ==========================================
          AUTH
      ========================================== */}

      {view === "auth" && (
        <main className="auth-page">
          <div className="auth-card">
            <span className="eyebrow">
              STYLEFLOW ACCOUNT
            </span>

            <h1>
              {authMode === "login"
                ? "Welcome back"
                : "Create your account"}
            </h1>

            <p>
              {authMode === "login"
                ? "Sign in to manage your appointments."
                : "Book your next appointment in minutes."}
            </p>

            <form
              onSubmit={handleAuthSubmit}
            >
              {authMode === "register" && (
                <>
                  <label>
                    Full name
                    <input
                      value={authForm.name}
                      onChange={(e) =>
                        setAuthForm({
                          ...authForm,
                          name: e.target.value,
                        })
                      }
                      required
                    />
                  </label>

                  <label>
                    Phone
                    <input
                      value={authForm.phone}
                      onChange={(e) =>
                        setAuthForm({
                          ...authForm,
                          phone: e.target.value,
                        })
                      }
                    />
                  </label>
                </>
              )}

              <label>
                Email
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(e) =>
                    setAuthForm({
                      ...authForm,
                      email: e.target.value,
                    })
                  }
                  required
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  value={authForm.password}
                  onChange={(e) =>
                    setAuthForm({
                      ...authForm,
                      password: e.target.value,
                    })
                  }
                  required
                />
              </label>

              <button
                className="primary-button full"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Please wait..."
                  : authMode === "login"
                  ? "Login"
                  : "Create Account"}
              </button>
            </form>

            <button
              className="switch-auth"
              onClick={() =>
                setAuthMode(
                  authMode === "login"
                    ? "register"
                    : "login"
                )
              }
            >
              {authMode === "login"
                ? "Don't have an account? Register"
                : "Already have an account? Login"}
            </button>
          </div>
        </main>
      )}
    </div>
  );
}

// ==================================================
// COMPONENTS
// ==================================================

function SalonCard({ salon, onClick }) {
  return (
    <article
      className="salon-card"
      onClick={onClick}
    >
      <div className="salon-image">
        <img
          src={salon.image}
          alt={salon.name}
        />

        <span className="rating-badge">
          ★ {salon.rating}
        </span>
      </div>

      <div className="salon-content">
        <h3>{salon.name}</h3>

        <p>
          {salon.address}, {salon.city}
        </p>

        <span className="view-link">
          View salon →
        </span>
      </div>
    </article>
  );
}

// ==================================================
// FORMATTERS
// ==================================================

function formatTime(time) {
  if (!time) return "";

  const [hourString, minute] =
    time.split(":");

  let hour = Number(hourString);

  const suffix =
    hour >= 12 ? "PM" : "AM";

  hour = hour % 12 || 12;

  return `${hour}:${minute} ${suffix}`;
}

function formatDate(date) {
  if (!date) return "";

  const value = new Date(
    `${date}T00:00:00`
  );

  return value.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

export default App;

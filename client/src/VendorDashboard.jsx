import { useEffect, useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

function VendorDashboard({ onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showSalonForm, setShowSalonForm] = useState(false);
  const [showStylistForm, setShowStylistForm] = useState(false);

  const [salonForm, setSalonForm] = useState({
    name: "",
    description: "",
    address: "",
    city: "",
    phone: "",
    image: "",
    rating: "4.5",
  });

  const [stylistForm, setStylistForm] = useState({
    salonId: "",
    name: "",
    specialization: "",
    experience: "",
    phone: "",
    start: "10:00",
    end: "20:00",
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  // ==========================================
  // LOAD VENDOR DASHBOARD
  // ==========================================

  const loadDashboard = async () => {
    try {
      setError("");

      const token =
        localStorage.getItem("styleflow_token");

      const response = await fetch(
        `${API_URL}/vendor/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to load vendor dashboard"
        );
      }

      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // ADD SALON
  // ==========================================

  const handleAddSalon = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const token =
        localStorage.getItem("styleflow_token");

      const response = await fetch(
        `${API_URL}/salons`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: salonForm.name.trim(),
            description:
              salonForm.description.trim(),
            address: salonForm.address.trim(),
            city: salonForm.city.trim(),
            phone: salonForm.phone.trim(),
            image:
              salonForm.image.trim() ||
              "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=80",
            rating: Number(salonForm.rating),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to create salon"
        );
      }

      setShowSalonForm(false);

      setSalonForm({
        name: "",
        description: "",
        address: "",
        city: "",
        phone: "",
        image: "",
        rating: "4.5",
      });

      setSuccess(
        "Salon created successfully."
      );

      await loadDashboard();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // ==========================================
  // ADD STYLIST
  // ==========================================

  const handleAddStylist = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const token =
        localStorage.getItem("styleflow_token");

      const response = await fetch(
        `${API_URL}/salons/${stylistForm.salonId}/stylists`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: stylistForm.name.trim(),

            specialization:
              stylistForm.specialization
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),

            experience: Number(
              stylistForm.experience || 0
            ),

            phone: stylistForm.phone.trim(),

            workingHours: {
              start: stylistForm.start,
              end: stylistForm.end,
            },
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to add stylist"
        );
      }

      setShowStylistForm(false);

      setStylistForm({
        salonId: "",
        name: "",
        specialization: "",
        experience: "",
        phone: "",
        start: "10:00",
        end: "20:00",
      });

      setSuccess(
        "Stylist added successfully."
      );

      await loadDashboard();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading && !data) {
    return (
      <main className="vendor-page">
        <div className="loading">
          Loading vendor dashboard...
        </div>
      </main>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error && !data) {
    return (
      <main className="vendor-page">
        <button
          className="back-button"
          onClick={onBack}
        >
          ← Back
        </button>

        <div className="alert error-alert">
          {error}
        </div>
      </main>
    );
  }

  return (
    <main className="vendor-page">

      {/* ======================================
          HEADER
      ====================================== */}

      <div className="vendor-header">
        <div>
          <span className="eyebrow">
            BUSINESS MANAGEMENT
          </span>

          <h1>Vendor Dashboard</h1>

          <p>
            Manage your salon operations,
            stylists, services and appointments.
          </p>
        </div>

        <button
          className="back-button"
          onClick={onBack}
        >
          ← Customer View
        </button>
      </div>

      {/* ======================================
          ALERTS
      ====================================== */}

      {error && (
        <div className="alert error-alert vendor-alert">
          <span>{error}</span>

          <button
            onClick={() => setError("")}
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="alert success-alert vendor-alert">
          <span>{success}</span>

          <button
            onClick={() => setSuccess("")}
          >
            ×
          </button>
        </div>
      )}

      {/* ======================================
          STATS
      ====================================== */}

      <section className="vendor-stats">

        <Stat
          label="Salons"
          value={data?.stats?.salons || 0}
        />

        <Stat
          label="Services"
          value={data?.stats?.services || 0}
        />

        <Stat
          label="Stylists"
          value={data?.stats?.stylists || 0}
        />

        <Stat
          label="Confirmed"
          value={
            data?.stats?.confirmedBookings || 0
          }
        />

        <Stat
          label="Completed"
          value={
            data?.stats?.completedBookings || 0
          }
        />

        <Stat
          label="Revenue"
          value={`₹${
            data?.stats?.revenue || 0
          }`}
        />

      </section>

      {/* ======================================
          SALONS + STYLISTS
      ====================================== */}

      <section className="vendor-grid">

        {/* ====================================
            SALONS
        ==================================== */}

        <div className="vendor-card">

          <div className="vendor-card-heading">
            <div>
              <span className="eyebrow">
                YOUR BUSINESS
              </span>

              <h2>Salons</h2>

              <button
                type="button"
                className="dashboard-add-button"
                onClick={() => {
                  setError("");
                  setSuccess("");
                  setShowStylistForm(false);
                  setShowSalonForm(
                    !showSalonForm
                  );
                }}
              >
                {showSalonForm
                  ? "× Close"
                  : "+ Add Salon"}
              </button>
            </div>
          </div>

          {/* ADD SALON FORM */}

          {showSalonForm && (
            <form
              className="dashboard-form"
              onSubmit={handleAddSalon}
            >
              <h3>
                Create a new salon
              </h3>

              <input
                type="text"
                placeholder="Salon name"
                value={salonForm.name}
                onChange={(e) =>
                  setSalonForm({
                    ...salonForm,
                    name: e.target.value,
                  })
                }
                required
              />

              <input
                type="text"
                placeholder="City"
                value={salonForm.city}
                onChange={(e) =>
                  setSalonForm({
                    ...salonForm,
                    city: e.target.value,
                  })
                }
                required
              />

              <input
                type="text"
                placeholder="Address"
                value={salonForm.address}
                onChange={(e) =>
                  setSalonForm({
                    ...salonForm,
                    address: e.target.value,
                  })
                }
                required
              />

              <input
                type="tel"
                placeholder="Phone"
                value={salonForm.phone}
                onChange={(e) =>
                  setSalonForm({
                    ...salonForm,
                    phone: e.target.value,
                  })
                }
              />

              <input
                type="url"
                placeholder="Image URL (optional)"
                value={salonForm.image}
                onChange={(e) =>
                  setSalonForm({
                    ...salonForm,
                    image: e.target.value,
                  })
                }
              />

              <textarea
                placeholder="Salon description"
                value={salonForm.description}
                onChange={(e) =>
                  setSalonForm({
                    ...salonForm,
                    description:
                      e.target.value,
                  })
                }
              />

              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                placeholder="Rating"
                value={salonForm.rating}
                onChange={(e) =>
                  setSalonForm({
                    ...salonForm,
                    rating: e.target.value,
                  })
                }
              />

              <div className="form-actions">
                <button
                  type="submit"
                  className="primary-button"
                  disabled={loading}
                >
                  {loading
                    ? "Saving..."
                    : "Save Salon"}
                </button>

                <button
                  type="button"
                  className="nav-outline"
                  onClick={() =>
                    setShowSalonForm(false)
                  }
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* SALON LIST */}

          <div className="dashboard-scroll-list">
            {data?.salons?.length ? (
              data.salons.map((salon) => (
                <div
                  className="vendor-item"
                  key={salon._id}
                >
                  <div>
                    <strong>
                      {salon.name}
                    </strong>

                    <small>
                      {salon.address},{" "}
                      {salon.city}
                    </small>
                  </div>

                  <span>
                    ★ {salon.rating}
                  </span>
                </div>
              ))
            ) : (
              <p className="muted">
                No salons found.
              </p>
            )}
          </div>

        </div>

        {/* ====================================
            STYLISTS
        ==================================== */}

        <div className="vendor-card">

          <div className="vendor-card-heading">
            <div>
              <span className="eyebrow">
                TEAM
              </span>

              <h2>Stylists</h2>

              <button
                type="button"
                className="dashboard-add-button"
                onClick={() => {
                  setError("");
                  setSuccess("");
                  setShowSalonForm(false);
                  setShowStylistForm(
                    !showStylistForm
                  );
                }}
              >
                {showStylistForm
                  ? "× Close"
                  : "+ Add Stylist"}
              </button>
            </div>
          </div>

          {/* ADD STYLIST FORM */}

          {showStylistForm && (
            <form
              className="dashboard-form"
              onSubmit={handleAddStylist}
            >
              <h3>
                Add a stylist
              </h3>

              <select
                value={stylistForm.salonId}
                onChange={(e) =>
                  setStylistForm({
                    ...stylistForm,
                    salonId:
                      e.target.value,
                  })
                }
                required
              >
                <option value="">
                  Select Salon
                </option>

                {data?.salons?.map(
                  (salon) => (
                    <option
                      key={salon._id}
                      value={salon._id}
                    >
                      {salon.name} —{" "}
                      {salon.city}
                    </option>
                  )
                )}
              </select>

              <input
                type="text"
                placeholder="Stylist name"
                value={stylistForm.name}
                onChange={(e) =>
                  setStylistForm({
                    ...stylistForm,
                    name: e.target.value,
                  })
                }
                required
              />

              <input
                type="text"
                placeholder="Specializations (Haircuts, Fades, Styling)"
                value={
                  stylistForm.specialization
                }
                onChange={(e) =>
                  setStylistForm({
                    ...stylistForm,
                    specialization:
                      e.target.value,
                  })
                }
              />

              <input
                type="number"
                min="0"
                placeholder="Experience in years"
                value={stylistForm.experience}
                onChange={(e) =>
                  setStylistForm({
                    ...stylistForm,
                    experience:
                      e.target.value,
                  })
                }
              />

              <input
                type="tel"
                placeholder="Phone"
                value={stylistForm.phone}
                onChange={(e) =>
                  setStylistForm({
                    ...stylistForm,
                    phone: e.target.value,
                  })
                }
              />

              <div className="time-row">
                <div>
                  <label>
                    Start
                  </label>

                  <input
                    type="time"
                    value={
                      stylistForm.start
                    }
                    onChange={(e) =>
                      setStylistForm({
                        ...stylistForm,
                        start:
                          e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label>
                    End
                  </label>

                  <input
                    type="time"
                    value={
                      stylistForm.end
                    }
                    onChange={(e) =>
                      setStylistForm({
                        ...stylistForm,
                        end:
                          e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="primary-button"
                  disabled={loading}
                >
                  {loading
                    ? "Saving..."
                    : "Save Stylist"}
                </button>

                <button
                  type="button"
                  className="nav-outline"
                  onClick={() =>
                    setShowStylistForm(
                      false
                    )
                  }
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* STYLIST LIST */}

          <div className="dashboard-scroll-list">
            {data?.stylists?.length ? (
              data.stylists.map(
                (stylist) => (
                  <div
                    className="vendor-item"
                    key={stylist._id}
                  >
                    <div>
                      <strong>
                        {stylist.name}
                      </strong>

                      <small>
                        {stylist.experience}{" "}
                        years experience
                      </small>
                    </div>

                    <span>
                      {stylist
                        .specialization?.[0] ||
                        "Stylist"}
                    </span>
                  </div>
                )
              )
            ) : (
              <p className="muted">
                No stylists found.
              </p>
            )}
          </div>

        </div>

      </section>

      {/* ======================================
          RECENT BOOKINGS
      ====================================== */}

      <section className="vendor-card bookings-card">

        <div className="vendor-card-heading">
          <div>
            <span className="eyebrow">
              APPOINTMENTS
            </span>

            <h2>Recent bookings</h2>
          </div>
        </div>

        {data?.recentBookings?.length ? (
          <div className="vendor-bookings">

            {data.recentBookings.map(
              (booking) => (
                <div
                  className="vendor-booking"
                  key={booking._id}
                >
                  <div className="vendor-booking-date">
                    <strong>
                      {booking.bookingDate}
                    </strong>

                    <span>
                      {booking.startTime}
                    </span>
                  </div>

                  <div>
                    <strong>
                      {booking.customer?.name ||
                        "Customer"}
                    </strong>

                    <small>
                      {booking.service?.name}{" "}
                      with{" "}
                      {booking.stylist?.name}
                    </small>
                  </div>

                  <div>
                    <strong>
                      ₹{booking.price}
                    </strong>

                    <span
                      className={`status ${booking.status}`}
                    >
                      {booking.status}
                    </span>
                  </div>
                </div>
              )
            )}

          </div>
        ) : (
          <p className="muted">
            No bookings yet.
          </p>
        )}

      </section>
    </main>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default VendorDashboard;
import { useEffect, useState } from "react";
import { getTrainers, addTrainer, updateTrainer, deleteTrainer } from "../services/trainerService";
import "./pages.css";

function Trainer() {
  const [trainers, setTrainers] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All"); // 'All', 'Active', 'Inactive'

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    specialization: "",
    experience: "",
    joining_date: "",
    status: ""
  });

  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    specialization: "",
    experience: "",
    joining_date: "",
    status: ""
  });

  const loadTrainers = async () => {
    try {
      const res = await getTrainers();
      setTrainers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to load trainers", error);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTrainers();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEdit = (trainer) => {
    setEditingId(trainer.trainer_id);
    let formattedDate = "";
    if (trainer.joining_date) {
      try {
        const dateObj = new Date(trainer.joining_date);
        formattedDate = dateObj.toISOString().split('T')[0];
      } catch (err) {
        console.error(err);
      }
    }
    setEditForm({
      full_name: trainer.full_name || "",
      email: trainer.email || "",
      phone: trainer.phone || "",
      specialization: trainer.specialization || "",
      experience: trainer.experience || "",
      joining_date: formattedDate,
      status: trainer.status || ""
    });
  };

  const handleUpdateTrainer = async (e) => {
    e.preventDefault();
    try {
      await updateTrainer(editingId, editForm);
      setEditingId(null);
      loadTrainers();
    } catch (error) {
      console.error("Failed to update trainer", error);
    }
  };

  const handleDeleteTrainer = async (id) => {
    if (window.confirm("Are you sure you want to delete this trainer?")) {
      try {
        await deleteTrainer(id);
        loadTrainers();
      } catch (error) {
        console.error("Failed to delete trainer", error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addTrainer(form);
      setForm({
        full_name: "",
        email: "",
        phone: "",
        specialization: "",
        experience: "",
        joining_date: "",
        status: ""
      });
      loadTrainers();
    } catch (error) {
      console.error("Failed to add trainer", error);
    }
  };

  // KPI Calculations
  const totalCount = trainers.length;
  const activeCount = trainers.filter(t => t.status === "Active").length;
  const avgExp = trainers.length > 0
    ? (trainers.reduce((acc, t) => acc + (parseFloat(t.experience) || 0), 0) / trainers.length).toFixed(1)
    : "0";
  const specCount = new Set(trainers.map(t => t.specialization).filter(Boolean)).size;

  // Filtered List
  const filteredTrainers = trainers.filter(t => {
    const queryMatch =
      t.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.specialization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const statusMatch =
      statusFilter === "All" ||
      t.status === statusFilter;
    return queryMatch && statusMatch;
  });

  return (
    <div className="page-wrapper">
      <div className="page-container">

        {/* Page Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title"> Trainer Management</h1>
            <p className="page-subtitle">Manage your team of professional fitness trainers</p>
          </div>
        </div>

        {/* Dynamic Metric Cards */}
        <div className="metrics-row">
          <div className="metric-card">
            <span className="metric-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <div className="metric-info">
              <span className="metric-value">{totalCount}</span>
              <span className="metric-label">Total Staff</span>
            </div>
          </div>
          <div className="metric-card">
            <span className="metric-icon active-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </span>
            <div className="metric-info">
              <span className="metric-value">{activeCount}</span>
              <span className="metric-label">Active Instructors</span>
            </div>
          </div>
          <div className="metric-card">
            <span className="metric-icon spec-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </span>
            <div className="metric-info">
              <span className="metric-value">{specCount}</span>
              <span className="metric-label">Specializations</span>
            </div>
          </div>
          <div className="metric-card">
            <span className="metric-icon exp-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="7" />
                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
              </svg>
            </span>
            <div className="metric-info">
              <span className="metric-value">{avgExp} yr</span>
              <span className="metric-label">Avg. Experience</span>
            </div>
          </div>
        </div>

        {/* Page Control Bar */}
        <div className="page-controls">
          <div className="search-box">
            <svg className="search-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" x2="16.65" y1="21" y2="16.65"></line>
            </svg>
            <input
              type="text"
              className="search-control-input"
              placeholder="Search by name or specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-pills">
            <button
              className={`pill-btn ${statusFilter === "All" ? "active" : ""}`}
              onClick={() => setStatusFilter("All")}
            >
              All
            </button>
            <button
              className={`pill-btn ${statusFilter === "Active" ? "active" : ""}`}
              onClick={() => setStatusFilter("Active")}
            >
              Active
            </button>
            <button
              className={`pill-btn ${statusFilter === "Inactive" ? "active" : ""}`}
              onClick={() => setStatusFilter("Inactive")}
            >
              Inactive
            </button>
          </div>
        </div>

        {/* Forms Row */}
        <div className="content-grid">
          {editingId && (
            <div className="form-card animate-slide-up">
              <h3 className="form-card-title">Edit Trainer Details</h3>
              <form onSubmit={handleUpdateTrainer}>
                <div className="form-group">
                  <div>
                    <label className="form-label">Full Name</label>
                    <input
                      name="full_name"
                      placeholder="Enter full name"
                      value={editForm.full_name}
                      onChange={handleEditChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Email</label>
                    <input
                      name="email"
                      type="email"
                      placeholder="Enter email"
                      value={editForm.email}
                      onChange={handleEditChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div>
                    <label className="form-label">Phone</label>
                    <input
                      name="phone"
                      placeholder="Enter phone number"
                      value={editForm.phone}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div>
                    <label className="form-label">Specialization</label>
                    <input
                      name="specialization"
                      placeholder="e.g., Weightlifting"
                      value={editForm.specialization}
                      onChange={handleEditChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div>
                    <label className="form-label">Experience (Years)</label>
                    <input
                      name="experience"
                      type="number"
                      placeholder="Years of experience"
                      value={editForm.experience}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div>
                    <label className="form-label">Joining Date</label>
                    <input
                      type="date"
                      name="joining_date"
                      value={editForm.joining_date}
                      onChange={handleEditChange}
                    />
                  </div>
                </div>

                <div className="form-group full">
                  <label className="form-label">Status</label>
                  <select
                    name="status"
                    value={editForm.status}
                    onChange={handleEditChange}
                    required
                  >
                    <option value="">Select Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="button-group">
                  <button type="submit" className="button-primary">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Update Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="button-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="form-card">
            <h3 className="form-card-title">Add New Trainer</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <div>
                  <label className="form-label">Full Name</label>
                  <input
                    name="full_name"
                    placeholder="Enter full name"
                    value={form.full_name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input
                    name="email"
                    type="email"
                    placeholder="Enter email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <div>
                  <label className="form-label">Phone</label>
                  <input
                    name="phone"
                    placeholder="Enter phone number"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="form-label">Specialization</label>
                  <input
                    name="specialization"
                    placeholder="e.g., Weightlifting"
                    value={form.specialization}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <div>
                  <label className="form-label">Experience (Years)</label>
                  <input
                    name="experience"
                    type="number"
                    placeholder="Years of experience"
                    value={form.experience}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="form-label">Joining Date</label>
                  <input
                    type="date"
                    name="joining_date"
                    value={form.joining_date}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group full">
                <label className="form-label">Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="button-group">
                <button type="submit" className="button-primary">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add Trainer
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Trainer Directory Grid */}
        <h2 style={{ display: 'block', marginBottom: '20px', borderBottom: '2px solid var(--accent)' }}>Trainer Directory</h2>

        {filteredTrainers.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-state-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" x2="9.01" y1="9" y2="9" />
                <line x1="15" x2="15.01" y1="9" y2="9" />
              </svg>
            </div>
            <p className="empty-state-text">No trainers found matching filter criteria.</p>
          </div>
        ) : (
          <div className="cards-grid animate-slide-up">
            {filteredTrainers.map((t) => {
              const initials = t.full_name
                ? t.full_name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)
                : "?";
              return (
                <div key={t.trainer_id} className="trainer-card">
                  <div className="trainer-card-header">
                    <span className="trainer-avatar">{initials}</span>
                    <span className={`status-badge status-${t.status?.toLowerCase() || "inactive"}`}>
                      {t.status || "N/A"}
                    </span>
                  </div>

                  <div className="trainer-info-section">
                    <h3 className="trainer-name">{t.full_name}</h3>
                    <span className="trainer-specialty">{t.specialization || "General Fitness"}</span>
                  </div>

                  <div className="trainer-details-list">
                    <div className="trainer-detail-item">
                      <span className="trainer-detail-icon">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="20" height="16" x="2" y="4" rx="2" />
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                      </span>
                      <span>{t.email}</span>
                    </div>
                    <div className="trainer-detail-item">
                      <span className="trainer-detail-icon">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                      </span>
                      <span>{t.phone || "No phone number"}</span>
                    </div>
                    <div className="trainer-detail-item">
                      <span className="trainer-detail-icon">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      </span>
                      <span>{t.experience ? `${t.experience} years experience` : "No experience listed"}</span>
                    </div>
                    <div className="trainer-detail-item">
                      <span className="trainer-detail-icon">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                          <line x1="16" x2="16" y1="2" y2="6" />
                          <line x1="8" x2="8" y1="2" y2="6" />
                          <line x1="3" x2="21" y1="10" y2="10" />
                        </svg>
                      </span>
                      <span>Joined: {t.joining_date ? new Date(t.joining_date).toLocaleDateString() : "-"}</span>
                    </div>
                  </div>

                  <div className="card-actions-row">
                    <button
                      className="button-sm button-sm-primary"
                      onClick={() => handleEdit(t)}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      className="button-sm button-sm-danger"
                      onClick={() => handleDeleteTrainer(t.trainer_id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Trainer;
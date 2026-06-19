import { useEffect, useState } from "react";
import { getMemberships, addMembership, updateMembership, deleteMembership } from "../services/membershipService";
import "./pages.css";

function Membership() {
  const [plans, setPlans] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All"); // 'All', 'Active', 'Inactive'

  const [form, setForm] = useState({
    plan_name: "",
    price: "",
    duration_months: "",
    description: "",
    status: ""
  });

  const [editForm, setEditForm] = useState({
    plan_name: "",
    price: "",
    duration_months: "",
    description: "",
    status: ""
  });

  const loadPlans = async () => {
    try {
      const res = await getMemberships();
      setPlans(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to load membership plans", error);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPlans();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEdit = (plan) => {
    setEditingId(plan.plan_id);
    setEditForm({
      plan_name: plan.plan_name || "",
      price: plan.price ? plan.price.toString() : "",
      duration_months: plan.duration_months ? plan.duration_months.toString() : "",
      description: plan.description || "",
      status: plan.status || ""
    });
  };

  const handleUpdatePlan = async (e) => {
    e.preventDefault();
    try {
      const formData = {
        ...editForm,
        price: parseInt(editForm.price) || 0,
        duration_months: parseInt(editForm.duration_months) || 0
      };
      await updateMembership(editingId, formData);
      setEditingId(null);
      await loadPlans();
    } catch (error) {
      console.error("Failed to update membership plan", error);
    }
  };

  const handleDeletePlan = async (id) => {
    if (window.confirm("Are you sure you want to delete this membership plan?")) {
      try {
        await deleteMembership(id);
        await loadPlans();
      } catch (error) {
        console.error("Failed to delete membership plan", error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = {
        ...form,
        price: parseInt(form.price) || 0,
        duration_months: parseInt(form.duration_months) || 0
      };
      await addMembership(formData);
      await loadPlans();

      setForm({
        plan_name: "",
        price: "",
        duration_months: "",
        description: "",
        status: ""
      });
    } catch (error) {
      console.error("Failed to add membership plan", error);
    }
  };

  // KPI Calculations
  const totalCount = plans.length;
  const activeCount = plans.filter(p => p.status === "Active").length;

  const avgMonthly = plans.length > 0
    ? (plans.reduce((sum, p) => sum + ((p.price || 0) / (p.duration_months || 1)), 0) / plans.length).toFixed(0)
    : "0";

  const highestPrice = plans.length > 0
    ? Math.max(...plans.map(p => p.price || 0))
    : 0;

  // Filtered List
  const filteredPlans = plans.filter(p => {
    const queryMatch =
      p.plan_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const statusMatch =
      statusFilter === "All" ||
      p.status === statusFilter;
    return queryMatch && statusMatch;
  });

  return (
    <div className="page-wrapper">
      <div className="page-container">

        {/* Page Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title"> Membership Plans</h1>
            <p className="page-subtitle">Create and manage flexible membership packages for your members</p>
          </div>
        </div>

        {/* Dynamic Metric Cards */}
        <div className="metrics-row">
          <div className="metric-card">
            <span className="metric-icon"></span>
            <div className="metric-info">
              <span className="metric-value">{totalCount}</span>
              <span className="metric-label">Total Plans</span>
            </div>
          </div>
          <div className="metric-card">
            <span className="metric-icon active-icon">✓</span>
            <div className="metric-info">
              <span className="metric-value">{activeCount}</span>
              <span className="metric-label">Active Packages</span>
            </div>
          </div>
          <div className="metric-card">
            <span className="metric-icon spec-icon">₹</span>
            <div className="metric-info">
              <span className="metric-value">₹{parseInt(avgMonthly).toLocaleString()}</span>
              <span className="metric-label">Avg. Monthly Fee</span>
            </div>
          </div>
          <div className="metric-card">
            <span className="metric-icon exp-icon">👑</span>
            <div className="metric-info">
              <span className="metric-value">₹{highestPrice.toLocaleString()}</span>
              <span className="metric-label">Highest Rate</span>
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
              placeholder="Search plans by name or details..."
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
              <h3 className="form-card-title">Edit Membership Plan</h3>
              <form onSubmit={handleUpdatePlan}>
                <div className="form-group full">
                  <label className="form-label">Plan Name</label>
                  <input
                    name="plan_name"
                    placeholder="e.g., Gold Premium"
                    value={editForm.plan_name}
                    onChange={handleEditChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <div>
                    <label className="form-label">Price (₹)</label>
                    <input
                      name="price"
                      type="number"
                      placeholder="Enter price"
                      value={editForm.price}
                      onChange={handleEditChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Duration (Months)</label>
                    <input
                      name="duration_months"
                      type="number"
                      placeholder="Number of months"
                      value={editForm.duration_months}
                      onChange={handleEditChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group full">
                  <label className="form-label">Description</label>
                  <textarea
                    name="description"
                    placeholder="Describe what's included in this plan"
                    value={editForm.description}
                    onChange={handleEditChange}
                    rows="3"
                  />
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
                    ✓ Update Plan
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
            <h3 className="form-card-title">Create New Plan</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group full">
                <label className="form-label">Plan Name</label>
                <input
                  name="plan_name"
                  placeholder="e.g., Gold Premium"
                  value={form.plan_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <div>
                  <label className="form-label">Price (₹)</label>
                  <input
                    name="price"
                    type="number"
                    placeholder="Enter price"
                    value={form.price}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Duration (Months)</label>
                  <input
                    name="duration_months"
                    type="number"
                    placeholder="Number of months"
                    value={form.duration_months}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group full">
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  placeholder="Describe what's included in this plan"
                  value={form.description}
                  onChange={handleChange}
                  rows="3"
                />
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
                  + Create Plan
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Membership Plans Grid */}
        <h2 style={{ display: 'block', marginBottom: '20px', borderBottom: '2px solid var(--accent)' }}>All Membership Plans</h2>

        {filteredPlans.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-state-icon"></div>
            <p className="empty-state-text">No membership plans found matching filter criteria.</p>
          </div>
        ) : (
          <div className="cards-grid animate-slide-up">
            {filteredPlans.map((p) => {
              const monthlyPrice = p.duration_months > 0
                ? Math.round(p.price / p.duration_months)
                : p.price;
              return (
                <div key={p.plan_id} className="plan-card">
                  <div className="plan-card-header">
                    <h3 className="plan-card-title">{p.plan_name}</h3>
                    <span className={`status-badge status-${p.status?.toLowerCase() || "inactive"}`}>
                      {p.status || "N/A"}
                    </span>
                  </div>

                  <div className="plan-price-tag">
                    <span className="plan-price-amount">₹{p.price.toLocaleString()}</span>
                    <span className="plan-price-duration">/ {p.duration_months} Months</span>
                  </div>

                  <p className="plan-description">{p.description || "Access premium strength gym equipment and amenities."}</p>

                  <ul className="plan-card-features">
                    <li className="plan-card-feature-item">Approx. ₹{monthlyPrice.toLocaleString()} / month</li>
                    <li className="plan-card-feature-item">Full gym facilities access</li>
                    <li className="plan-card-feature-item">Locker & shower services</li>
                  </ul>

                  <div className="card-actions-row">
                    <button
                      className="button-sm button-sm-primary"
                      onClick={() => handleEdit(p)}
                    >
                      ✎ Edit
                    </button>
                    <button
                      className="button-sm button-sm-danger"
                      onClick={() => handleDeletePlan(p.plan_id)}
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

export default Membership;
import "./pages.css";

function MemberDashboard() {
  return (
    <div className="page-wrapper">
      <div className="page-container">
        <h1 className="page-title">Member Dashboard</h1>

        <div className="content-grid">
          <div className="form-card">
            <h3>Membership Status</h3>
            <h2>Active</h2>
          </div>

          <div className="form-card">
            <h3>Next Due Date</h3>
            <h2>25 Jun 2026</h2>
          </div>

          <div className="form-card">
            <h3>Assigned Trainer</h3>
            <h2>John</h2>
          </div>

          <div className="form-card">
            <h3>Total Payments</h3>
            <h2>₹5000</h2>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MemberDashboard;
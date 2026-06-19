import "./pages.css";

function AdminDashboard() {
  return (
    <div className="page-wrapper">
      <div className="page-container">
        <h1 className="page-title">Admin Dashboard</h1>

        <div className="content-grid">
          <div className="form-card">
            <h3>Total Revenue</h3>
            <h2>₹25,000</h2>
          </div>

          <div className="form-card">
            <h3>Total Payments</h3>
            <h2>35</h2>
          </div>

          <div className="form-card">
            <h3>Pending Payments</h3>
            <h2>5</h2>
          </div>

          <div className="form-card">
            <h3>Overdue Payments</h3>
            <h2>2</h2>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;

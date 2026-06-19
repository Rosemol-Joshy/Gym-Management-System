import "./pages.css";

function TrainerDashboard() {
  return (
    <div className="page-wrapper">
      <div className="page-container">
        <h1 className="page-title">Trainer Dashboard</h1>

        <div className="content-grid">
          <div className="form-card">
            <h3>Assigned Members</h3>
            <h2>12</h2>
          </div>

          <div className="form-card">
            <h3>Membership Ending Today</h3>
            <h2>2</h2>
          </div>

          <div className="form-card">
            <h3>Ending Within 7 Days</h3>
            <h2>4</h2>
          </div>

          <div className="form-card">
            <h3>Pending Payments</h3>
            <h2>3</h2>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TrainerDashboard;
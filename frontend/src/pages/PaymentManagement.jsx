import { useState } from "react";
import "./pages.css";

function PaymentManagement() {
  const [payments, setPayments] = useState([]);

  const [form, setForm] = useState({
    member_name: "",
    amount: "",
    payment_date: "",
    status: "Pending",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    setPayments([
      ...payments,
      {
        payment_id: payments.length + 1,
        ...form,
      },
    ]);

    setForm({
      member_name: "",
      amount: "",
      payment_date: "",
      status: "Pending",
    });
  };

  return (
    <div className="page-wrapper">
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Payment Management</h1>
        </div>

        <div className="form-card">
          <h3 className="form-card-title">Add Payment</h3>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <div>
                <label className="form-label">Member Name</label>
                <input
                  name="member_name"
                  value={form.member_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="form-label">Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div>
                <label className="form-label">Payment Date</label>
                <input
                  type="date"
                  name="payment_date"
                  value={form.payment_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="form-label">Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option>Paid</option>
                  <option>Pending</option>
                  <option>Overdue</option>
                </select>
              </div>
            </div>

            <button className="button-primary" type="submit">
              Add Payment
            </button>
          </form>
        </div>

        <div className="table-card">
          <h3 className="table-card-title">Payment Records</h3>

          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Member</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {payments.map((p) => (
                <tr key={p.payment_id}>
                  <td>{p.payment_id}</td>
                  <td>{p.member_name}</td>
                  <td>₹{p.amount}</td>
                  <td>{p.payment_date}</td>
                  <td>{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PaymentManagement;
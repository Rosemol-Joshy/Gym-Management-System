import { useEffect, useState } from "react";
import { getMemberships, addMembership, updateMembership, deleteMembership } from "../services/membershipService";

function Membership() {
  const [plans, setPlans] = useState([]);
  const [editingId, setEditingId] = useState(null);

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
      plan_name: plan.plan_name,
      price: plan.price.toString(),
      duration_months: plan.duration_months.toString(),
      description: plan.description,
      status: plan.status
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

  return (
    <div style={{ padding: "20px" }}>
      <h2>Membership Management</h2>

      {/* EDIT FORM - Show only when editing */}
      {editingId && (
        <div style={{ padding: "15px", backgroundColor: "#f0f0f0", marginBottom: "20px" }}>
          <h3>Edit Membership Plan (ID: {editingId})</h3>
          <form onSubmit={handleUpdatePlan}>
            <input name="plan_name" placeholder="Plan Name" onChange={handleEditChange} value={editForm.plan_name} />
            <input name="price" placeholder="Price" onChange={handleEditChange} value={editForm.price} type="number" />
            <input name="duration_months" placeholder="Duration (months)" onChange={handleEditChange} value={editForm.duration_months} type="number" />
            <input name="description" placeholder="Description" onChange={handleEditChange} value={editForm.description} />
            <input name="status" placeholder="Status" onChange={handleEditChange} value={editForm.status} />
            <button type="submit">Update Plan</button>
            <button type="button" onClick={() => setEditingId(null)}>Cancel</button>
          </form>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input name="plan_name" placeholder="Plan Name" onChange={handleChange} value={form.plan_name} />
        <input name="price" placeholder="Price" onChange={handleChange} value={form.price} type="number" />
        <input name="duration_months" placeholder="Duration (months)" onChange={handleChange} value={form.duration_months} type="number" />
        <input name="description" placeholder="Description" onChange={handleChange} value={form.description} />
        <input name="status" placeholder="Status" onChange={handleChange} value={form.status} />

        <button>Add Plan</button>
      </form>

      <table border="1" width="100%" style={{ marginTop: "20px" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Plan</th>
            <th>Price</th>
            <th>Duration</th>
            <th>Description</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {plans.map((p) => (
            <tr key={p.plan_id}>
              <td>{p.plan_id}</td>
              <td>{p.plan_name}</td>
              <td>{p.price}</td>
              <td>{p.duration_months}</td>
              <td>{p.description}</td>
              <td>{p.status}</td>
              <td>
                <button onClick={() => handleEdit(p)} style={{ marginRight: "5px" }}>Edit</button>
                <button onClick={() => handleDeletePlan(p.plan_id)} style={{ backgroundColor: "red", color: "white" }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Membership;
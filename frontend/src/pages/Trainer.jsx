import { useEffect, useState } from "react";
import { getTrainers, addTrainer, updateTrainer, deleteTrainer } from "../services/trainerService";

function Trainer() {
  const [trainers, setTrainers] = useState([]);
  const [editingId, setEditingId] = useState(null);

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
    const dateObj = new Date(trainer.joining_date);
    const formattedDate = dateObj.toISOString().split('T')[0];
    setEditForm({
      full_name: trainer.full_name,
      email: trainer.email,
      phone: trainer.phone,
      specialization: trainer.specialization,
      experience: trainer.experience,
      joining_date: formattedDate,
      status: trainer.status
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

  return (
    <div style={{ padding: "20px" }}>
      <h2>Trainer Management</h2>

      {/* EDIT FORM - Show only when editing */}
      {editingId && (
        <div style={{ padding: "15px", backgroundColor: "#f0f0f0", marginBottom: "20px" }}>
          <h3>Edit Trainer (ID: {editingId})</h3>
          <form onSubmit={handleUpdateTrainer}>
            <input
              name="full_name"
              placeholder="Full Name"
              value={editForm.full_name}
              onChange={handleEditChange}
            />
            <input
              name="email"
              placeholder="Email"
              value={editForm.email}
              onChange={handleEditChange}
            />
            <input
              name="phone"
              placeholder="Phone"
              value={editForm.phone}
              onChange={handleEditChange}
            />
            <input
              name="specialization"
              placeholder="Specialization"
              value={editForm.specialization}
              onChange={handleEditChange}
            />
            <input
              name="experience"
              placeholder="Experience"
              value={editForm.experience}
              onChange={handleEditChange}
            />
            <input
              name="joining_date"
              placeholder="Joining Date"
              value={editForm.joining_date}
              onChange={handleEditChange}
              type="date"
            />
            <input
              name="status"
              placeholder="Status"
              value={editForm.status}
              onChange={handleEditChange}
            />
            <button type="submit">Update Trainer</button>
            <button type="button" onClick={() => setEditingId(null)}>Cancel</button>
          </form>
        </div>
      )}

      {/* ADD TRAINER FORM */}
      <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
        <input
          name="full_name"
          placeholder="Full Name"
          value={form.full_name}
          onChange={handleChange}
        />
        <input
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
        />
        <input
          name="phone"
          placeholder="Phone"
          value={form.phone}
          onChange={handleChange}
        />
        <input
          name="specialization"
          placeholder="Specialization"
          value={form.specialization}
          onChange={handleChange}
        />
        <input
          name="experience"
          placeholder="Experience"
          value={form.experience}
          onChange={handleChange}
        />
        <input
          name="joining_date"
          placeholder="Joining Date"
          value={form.joining_date}
          onChange={handleChange}
          type="date"
        />
        <input
          name="status"
          placeholder="Status"
          value={form.status}
          onChange={handleChange}
        />

        <button type="submit">Add Trainer</button>
      </form>

      {/* TABLE */}
      <table border="1" width="100%">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Specialization</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
  {trainers.length === 0 ? (
    <tr>
      <td colSpan="5">No trainers found</td>
    </tr>
  ) : (
    trainers.map((t) => (
      <tr key={t.trainer_id}>
        <td>{t.trainer_id}</td>
        <td>{t.full_name}</td>
        <td>{t.email}</td>
        <td>{t.phone}</td>
        <td>{t.specialization}</td>
        <td>
          <button onClick={() => handleEdit(t)} style={{ marginRight: "5px" }}>Edit</button>
          <button onClick={() => handleDeleteTrainer(t.trainer_id)} style={{ backgroundColor: "red", color: "white" }}>Delete</button>
        </td>
      </tr>
    ))
  )}
</tbody>
      </table>
    </div>
  );
}

export default Trainer;
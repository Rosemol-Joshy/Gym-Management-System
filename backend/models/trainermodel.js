const db = require("../config/db");

const createTrainer = (trainerData, callback) => {
  const sql = `
    INSERT INTO trainers
    (full_name, email, phone, specialization, experience, joining_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      trainerData.full_name,
      trainerData.email,
      trainerData.phone,
      trainerData.specialization,
      trainerData.experience,
      trainerData.joining_date,
      trainerData.status,
    ],
    callback
  );
};
const getAllTrainers = (callback) => {
  const sql = "SELECT * FROM trainers";

  db.query(sql, callback);
};
const getTrainerById = (id, callback) => {
  const sql = "SELECT * FROM trainers WHERE trainer_id = ?";
  db.query(sql, [id], callback);
};
const updateTrainer = (id, trainerData, callback) => {
  const sql = `
    UPDATE trainers
    SET full_name = ?, email = ?, phone = ?, specialization = ?,
        experience = ?, joining_date = ?, status = ?
    WHERE trainer_id = ?
  `;

  db.query(
    sql,
    [
      trainerData.full_name,
      trainerData.email,
      trainerData.phone,
      trainerData.specialization,
      trainerData.experience,
      trainerData.joining_date,
      trainerData.status,
      id,
    ],
    callback
  );
};
const deleteTrainer = (id, callback) => {
  const sql = "DELETE FROM trainers WHERE trainer_id = ?";
  db.query(sql, [id], callback);
};
module.exports = {
  createTrainer,
  getAllTrainers,
    getTrainerById,
    updateTrainer,
    deleteTrainer,
};

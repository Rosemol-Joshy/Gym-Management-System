const trainerModel = require("../models/trainerModel");

const addTrainer = (req, res) => {
  trainerModel.createTrainer(req.body, (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }

    res.status(201).json({
      message: "Trainer added successfully",
    });
  });
};
const getAllTrainers = (req, res) => {
  trainerModel.getAllTrainers((err, results) => {
    if (err) {
      return res.status(500).json(err);
    }

    res.status(200).json(results);
  });
};
const getTrainerById = (req, res) => {
  const id = req.params.id;

  trainerModel.getTrainerById(id, (err, results) => {
    if (err) {
      return res.status(500).json(err);
    }

    res.status(200).json(results);
  });
};
const updateTrainer = (req, res) => {
  const id = req.params.id;

  trainerModel.updateTrainer(id, req.body, (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }

    res.json({
      message: "Trainer updated successfully",
    });
  });
};
const deleteTrainer = (req, res) => {
  const id = req.params.id;

  trainerModel.deleteTrainer(id, (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }

    res.json({
      message: "Trainer deleted successfully",
    });
  });
};
module.exports = {
  addTrainer,
  getAllTrainers,
  getTrainerById,
  updateTrainer,
  deleteTrainer,
};
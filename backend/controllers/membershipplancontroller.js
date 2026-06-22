const membershipPlanModel = require("../models/membershipPlanModel");

const addMembershipPlan = (req, res) => {
  membershipPlanModel.createMembershipPlan(req.body, (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }

    res.status(201).json({
      message: "Membership plan added successfully",
    });
  });
};
const getAllMembershipPlans = (req, res) => {
  membershipPlanModel.getAllMembershipPlans((err, results) => {
    if (err) {
      return res.status(500).json(err);
    }

    res.status(200).json(results);
  });
};
const getMembershipPlanById = (req, res) => {
  membershipPlanModel.getMembershipPlanById(req.params.id, (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }

    res.status(200).json(result);
  });
};
const updateMembershipPlan = (req, res) => {
  const id = req.params.id;

  membershipPlanModel.updateMembershipPlan(id, req.body, (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }

    res.json({
      message: "Membership plan updated successfully",
    });
  });
};
const deleteMembershipPlan = (req, res) => {
  const id = req.params.id;

  membershipPlanModel.deleteMembershipPlan(id, (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }

    res.json({
      message: "Membership plan deleted successfully",
    });
  });
};
module.exports = {
  addMembershipPlan,
  getAllMembershipPlans,
  getMembershipPlanById,
  updateMembershipPlan,
  deleteMembershipPlan,
};
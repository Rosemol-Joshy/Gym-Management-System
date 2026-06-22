const express = require("express");
const router = express.Router();

const membershipPlanController = require("../controllers/membershipPlanController");

router.post("/", membershipPlanController.addMembershipPlan);
router.get("/", membershipPlanController.getAllMembershipPlans);
router.get("/:id", membershipPlanController.getMembershipPlanById);
router.put("/:id", membershipPlanController.updateMembershipPlan);
router.delete("/:id", membershipPlanController.deleteMembershipPlan);
module.exports = router;
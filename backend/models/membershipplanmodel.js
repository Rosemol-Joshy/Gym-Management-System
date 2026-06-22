const db = require("../config/db");

const createMembershipPlan = (planData, callback) => {
  const sql = `
    INSERT INTO membership_plans
    (plan_name, duration_months, price, description, status)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      planData.plan_name,
      planData.duration_months,
      planData.price,
      planData.description,
      planData.status,
    ],
    callback
  );
};
const getAllMembershipPlans = (callback) => {
  const sql = "SELECT * FROM membership_plans";
  db.query(sql, callback);
};
const getMembershipPlanById = (id, callback) => {
  const sql = "SELECT * FROM membership_plans WHERE plan_id = ?";
  db.query(sql, [id], callback);
};
const updateMembershipPlan = (id, planData, callback) => {
  const sql = `
    UPDATE membership_plans
    SET plan_name = ?, duration_months = ?, price = ?,
        description = ?, status = ?
    WHERE plan_id = ?
  `;

  db.query(
    sql,
    [
      planData.plan_name,
      planData.duration_months,
      planData.price,
      planData.description,
      planData.status,
      id,
    ],
    callback
  );
};
const deleteMembershipPlan = (id, callback) => {
  const sql = "DELETE FROM membership_plans WHERE plan_id = ?";
  db.query(sql, [id], callback);
};
module.exports = {
  createMembershipPlan,
  getAllMembershipPlans,
  getMembershipPlanById,
  updateMembershipPlan,
  deleteMembershipPlan,
};
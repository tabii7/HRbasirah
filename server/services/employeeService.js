const db = require("../db");

function generateEmployeeId() {
  const ids = db
    .prepare("SELECT employeeId FROM users WHERE role != 'admin' AND employeeId IS NOT NULL")
    .all()
    .map((row) => row.employeeId);
  const maxNumber = ids.reduce((max, value) => {
    const match = /^EMP-(\d+)$/.exec(value || "");
    if (!match) return max;
    return Math.max(max, Number(match[1]));
  }, 0);
  const next = String(maxNumber + 1).padStart(4, "0");
  return `EMP-${next}`;
}

module.exports = { generateEmployeeId };

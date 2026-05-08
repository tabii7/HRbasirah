const express = require("express");
const db = require("../db");
const { SUPER_ADMIN_ROLES } = require("../config/constants");
const { authMiddleware, roleMiddleware } = require("../middleware/auth");
const { getMonthlyPayrollBreakdown } = require("../services/payrollService");
const { getMonthRange, toIsoDateOnly } = require("../utils/datePayroll");

const router = express.Router();

router.get("/preview", authMiddleware, roleMiddleware(SUPER_ADMIN_ROLES), (req, res) => {
  const { employeeUserId, month, asOfDate } = req.query;
  if (!employeeUserId || !month) {
    return res.status(400).json({ message: "employeeUserId and month are required" });
  }
  const breakdown = getMonthlyPayrollBreakdown({ employeeUserId, month, asOfDate });
  if (breakdown.error) {
    return res.status(breakdown.status || 400).json({ message: breakdown.error });
  }
  res.json(breakdown);
});

router.get("/monthly-report", authMiddleware, roleMiddleware(SUPER_ADMIN_ROLES), (req, res) => {
  const { month, asOfDate } = req.query;
  if (!month) {
    return res.status(400).json({ message: "month is required" });
  }
  const monthRange = getMonthRange(month);
  if (!monthRange) {
    return res.status(400).json({ message: "Month must be in YYYY-MM format" });
  }

  const employees = db.prepare("SELECT id FROM users WHERE role != 'admin' ORDER BY fullName ASC").all();

  const rows = [];
  let totalGrossSalary = 0;
  let totalUnpaidLeaveDeduction = 0;
  let totalNetSalary = 0;
  let totalUnpaidLeaveDays = 0;

  for (const emp of employees) {
    const breakdown = getMonthlyPayrollBreakdown({ employeeUserId: emp.id, month, asOfDate });
    if (breakdown.error) continue;
    rows.push({
      employeeUserId: breakdown.employee.id,
      employeeId: breakdown.employee.employeeId,
      fullName: breakdown.employee.fullName,
      designation: breakdown.employee.designation,
      month: breakdown.month,
      asOfDate: breakdown.asOfDate,
      grossSalary: breakdown.proratedGrossTillDate,
      fullMonthSalary: breakdown.fullMonthSalary,
      approvedLeaveDaysInMonthTillDate: breakdown.approvedLeaveDaysInMonthTillDate,
      paidLeaveDaysTillDate: breakdown.paidLeaveDaysTillDate,
      unpaidLeaveDaysTillDate: breakdown.unpaidLeaveDaysTillDate,
      unpaidLeaveDeductionTillDate: breakdown.unpaidLeaveDeductionTillDate,
      netSalaryTillDate: breakdown.netSalaryTillDate,
    });
    totalGrossSalary += breakdown.proratedGrossTillDate;
    totalUnpaidLeaveDeduction += breakdown.unpaidLeaveDeductionTillDate;
    totalNetSalary += breakdown.netSalaryTillDate;
    totalUnpaidLeaveDays += breakdown.unpaidLeaveDaysTillDate;
  }

  res.json({
    month,
    asOfDate: asOfDate || toIsoDateOnly(monthRange.monthEnd),
    totalEmployees: rows.length,
    totals: {
      grossSalary: Number(totalGrossSalary.toFixed(2)),
      unpaidLeaveDays: totalUnpaidLeaveDays,
      unpaidLeaveDeduction: Number(totalUnpaidLeaveDeduction.toFixed(2)),
      netSalaryToPay: Number(totalNetSalary.toFixed(2)),
    },
    rows,
  });
});

module.exports = router;

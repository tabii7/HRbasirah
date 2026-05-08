const db = require("../db");
const { getMonthRange, overlapDays, toIsoDateOnly, parseJoinedDateUtc } = require("../utils/datePayroll");

function getMonthlyPayrollBreakdown({ employeeUserId, month, asOfDate }) {
  const employee = db
    .prepare("SELECT id, fullName, employeeId, designation, monthlySalary, joinedDate FROM users WHERE id = ? AND role != 'admin'")
    .get(employeeUserId);
  if (!employee) return { error: "Employee not found", status: 404 };

  const monthRange = getMonthRange(month);
  if (!monthRange) return { error: "Month must be in YYYY-MM format", status: 400 };

  const monthlySalary = Number(employee.monthlySalary);
  if (!Number.isFinite(monthlySalary) || monthlySalary <= 0) {
    return { error: "Employee monthly salary is missing or invalid", status: 400 };
  }

  const [yearText] = String(month).split("-");
  const year = Number(yearText);
  if (!year) return { error: "Invalid month year", status: 400 };

  const effectiveAsOfDate = asOfDate ? new Date(`${asOfDate}T00:00:00Z`) : monthRange.monthEnd;
  if (Number.isNaN(effectiveAsOfDate.getTime())) {
    return { error: "asOfDate must be in YYYY-MM-DD format", status: 400 };
  }
  const asOfDateWithinMonth = new Date(Math.min(effectiveAsOfDate.getTime(), monthRange.monthEnd.getTime()));
  const asOfDateClamped = new Date(Math.max(asOfDateWithinMonth.getTime(), monthRange.monthStart.getTime()));

  const employmentStart = parseJoinedDateUtc(employee.joinedDate);
  let dutyStart = monthRange.monthStart;
  if (employmentStart) {
    if (employmentStart.getTime() > monthRange.monthEnd.getTime()) {
      const perDayIf = monthlySalary / monthRange.daysInMonth;
      return {
        employee,
        month,
        monthStart: toIsoDateOnly(monthRange.monthStart),
        monthEnd: toIsoDateOnly(monthRange.monthEnd),
        asOfDate: toIsoDateOnly(asOfDateClamped),
        daysInMonth: monthRange.daysInMonth,
        eligibleDaysInMonth: 0,
        eligibleDaysTillDate: 0,
        dutyStart: toIsoDateOnly(monthRange.monthStart),
        joinedDate: employee.joinedDate || null,
        paidLeavesPerYear: 20,
        usedPaidLeavesBeforeMonth: 0,
        remainingPaidLeavesAtMonthStart: 20,
        approvedLeaveDaysInMonth: 0,
        approvedLeaveDaysInMonthTillDate: 0,
        paidLeaveDays: 0,
        unpaidLeaveDays: 0,
        paidLeaveDaysTillDate: 0,
        unpaidLeaveDaysTillDate: 0,
        fullMonthSalary: Number(monthlySalary.toFixed(2)),
        grossSalary: 0,
        proratedGrossTillDate: 0,
        perDaySalary: Number(perDayIf.toFixed(2)),
        unpaidLeaveDeduction: 0,
        unpaidLeaveDeductionTillDate: 0,
        netSalary: 0,
        netSalaryTillDate: 0,
      };
    }
    dutyStart = new Date(Math.max(monthRange.monthStart.getTime(), employmentStart.getTime()));
  }

  const eligibleDaysInMonth = overlapDays(dutyStart, monthRange.monthEnd, monthRange.monthStart, monthRange.monthEnd);
  const eligibleDaysTillDate = overlapDays(dutyStart, asOfDateClamped, monthRange.monthStart, monthRange.monthEnd);

  const yearStart = new Date(Date.UTC(year, 0, 1));
  const entitlementYearStart =
    employmentStart && employmentStart.getTime() > yearStart.getTime() ? employmentStart : yearStart;
  const leaves = db
    .prepare("SELECT startDate, endDate, status FROM leaves WHERE employeeUserId = ? AND status = 'Approved'")
    .all(employeeUserId);

  let usedPaidLeavesBeforeMonth = 0;
  let approvedLeaveDaysInMonth = 0;
  let approvedLeaveDaysInMonthTillDate = 0;

  for (const leave of leaves) {
    const leaveStart = new Date(`${leave.startDate}T00:00:00Z`);
    const leaveEnd = new Date(`${leave.endDate}T00:00:00Z`);
    if (Number.isNaN(leaveStart.getTime()) || Number.isNaN(leaveEnd.getTime())) continue;

    const beforeMonthEnd = new Date(monthRange.monthStart.getTime() - 86400000);
    const daysBeforeMonth = overlapDays(leaveStart, leaveEnd, entitlementYearStart, beforeMonthEnd);
    if (daysBeforeMonth > 0) usedPaidLeavesBeforeMonth += daysBeforeMonth;

    const daysInMonth = overlapDays(leaveStart, leaveEnd, dutyStart, monthRange.monthEnd);
    if (daysInMonth > 0) approvedLeaveDaysInMonth += daysInMonth;

    const daysInMonthTillDate = overlapDays(leaveStart, leaveEnd, dutyStart, asOfDateClamped);
    if (daysInMonthTillDate > 0) approvedLeaveDaysInMonthTillDate += daysInMonthTillDate;
  }

  const PAID_LEAVES_PER_YEAR = 20;
  const remainingPaidLeavesAtMonthStart = Math.max(0, PAID_LEAVES_PER_YEAR - usedPaidLeavesBeforeMonth);
  const paidLeaveDays = Math.min(approvedLeaveDaysInMonth, remainingPaidLeavesAtMonthStart);
  const unpaidLeaveDays = Math.max(0, approvedLeaveDaysInMonth - paidLeaveDays);

  const paidLeaveDaysTillDate = Math.min(approvedLeaveDaysInMonthTillDate, remainingPaidLeavesAtMonthStart);
  const unpaidLeaveDaysTillDate = Math.max(0, approvedLeaveDaysInMonthTillDate - paidLeaveDaysTillDate);

  const perDaySalary = monthlySalary / monthRange.daysInMonth;
  const proratedGrossMonth = Number(((monthlySalary * eligibleDaysInMonth) / monthRange.daysInMonth).toFixed(2));
  const proratedGrossTillDate = Number(((monthlySalary * eligibleDaysTillDate) / monthRange.daysInMonth).toFixed(2));

  const unpaidLeaveDeduction = Number((unpaidLeaveDays * perDaySalary).toFixed(2));
  const unpaidLeaveDeductionTillDate = Number((unpaidLeaveDaysTillDate * perDaySalary).toFixed(2));
  const netSalary = Number((proratedGrossMonth - unpaidLeaveDeduction).toFixed(2));
  const netSalaryTillDate = Number((proratedGrossTillDate - unpaidLeaveDeductionTillDate).toFixed(2));

  return {
    employee,
    month,
    monthStart: toIsoDateOnly(monthRange.monthStart),
    monthEnd: toIsoDateOnly(monthRange.monthEnd),
    asOfDate: toIsoDateOnly(asOfDateClamped),
    daysInMonth: monthRange.daysInMonth,
    eligibleDaysInMonth,
    eligibleDaysTillDate,
    dutyStart: toIsoDateOnly(dutyStart),
    joinedDate: employee.joinedDate || null,
    paidLeavesPerYear: PAID_LEAVES_PER_YEAR,
    usedPaidLeavesBeforeMonth,
    remainingPaidLeavesAtMonthStart,
    approvedLeaveDaysInMonth,
    approvedLeaveDaysInMonthTillDate,
    paidLeaveDays,
    unpaidLeaveDays,
    paidLeaveDaysTillDate,
    unpaidLeaveDaysTillDate,
    fullMonthSalary: Number(monthlySalary.toFixed(2)),
    grossSalary: proratedGrossMonth,
    proratedGrossTillDate,
    perDaySalary: Number(perDaySalary.toFixed(2)),
    unpaidLeaveDeduction,
    unpaidLeaveDeductionTillDate,
    netSalary,
    netSalaryTillDate,
  };
}

module.exports = { getMonthlyPayrollBreakdown };

const fs = require("fs");
const path = require("path");
const db = require("../db");
const { uploadsDir, logoPath } = require("../config/paths");
const { getMonthlyPayrollBreakdown } = require("./payrollService");

function getSlipLogoDataUri() {
  if (!logoPath || !fs.existsSync(logoPath)) return "";
  const ext = path.extname(logoPath).toLowerCase() === ".jpg" ? "jpeg" : "png";
  const base64 = fs.readFileSync(logoPath).toString("base64");
  return `data:image/${ext};base64,${base64}`;
}

function getLastCompletedMonth() {
  const now = new Date();
  const lastMonthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const year = lastMonthDate.getUTCFullYear();
  const month = String(lastMonthDate.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function generateAndStoreAutoSlip(employeeUserId, month) {
  const breakdown = getMonthlyPayrollBreakdown({ employeeUserId, month });
  if (breakdown.error) {
    return { error: breakdown.error, status: breakdown.status || 400 };
  }

  const {
    employee,
    daysInMonth,
    eligibleDaysInMonth,
    dutyStart,
    approvedLeaveDaysInMonth,
    paidLeaveDays,
    unpaidLeaveDays,
    grossSalary,
    fullMonthSalary,
    perDaySalary,
    unpaidLeaveDeduction,
    netSalary,
  } = breakdown;

  const workedDays = Math.max(0, eligibleDaysInMonth - approvedLeaveDaysInMonth);
  const payableDays = eligibleDaysInMonth;
  const generatedAt = new Date().toISOString();
  const logoDataUri = getSlipLogoDataUri();

  const slipContent = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Salary Slip - ${employee.employeeId} - ${month}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 32px;
      background: #f4f7f6;
      color: #1f2a1f;
    }
    .sheet {
      position: relative;
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #d7e2d6;
      border-radius: 10px;
      padding: 28px;
      overflow: hidden;
    }
    .watermark {
      position: absolute;
      inset: 0;
      background-image: url("${logoDataUri}");
      background-repeat: no-repeat;
      background-position: center;
      background-size: 620px auto;
      opacity: 0.11;
      pointer-events: none;
      z-index: 0;
    }
    .top {
      position: relative;
      z-index: 1;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }
    .brand img {
      width: 160px;
      height: 54px;
      object-fit: contain;
    }
    .title {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 4px;
      letter-spacing: 0.02em;
    }
    .sub {
      font-size: 13px;
      color: #4e5f4d;
    }
    .meta {
      font-size: 12px;
      color: #5f6f5d;
      text-align: right;
    }
    table {
      position: relative;
      z-index: 1;
      width: 100%;
      border-collapse: collapse;
      margin-top: 14px;
      font-size: 14px;
    }
    th, td {
      border: 1px solid #d8e3d8;
      padding: 10px;
      text-align: left;
      background: rgba(255, 255, 255, 0.55);
    }
    th {
      background: rgba(223, 236, 222, 0.58);
      color: #2f3f2e;
      font-weight: 600;
    }
    .summary {
      margin-top: 16px;
      width: 320px;
      margin-left: auto;
    }
    .summary td:first-child {
      background: rgba(247, 250, 247, 0.62);
      width: 65%;
    }
    .net {
      font-weight: 700;
      color: #234223;
    }
    .footer {
      position: relative;
      z-index: 1;
      margin-top: 26px;
      font-size: 12px;
      color: #60715f;
    }
    @media print {
      body {
        background: #fff;
        padding: 0;
      }
      .sheet {
        border: none;
      }
    }
  </style>
</head>
<body>
  <section class="sheet">
    <div class="watermark"></div>
    <div class="top">
      <div>
        <div class="brand">
          <img src="${logoDataUri}" alt="Basirah Logo" />
          <div>
            <div class="sub">Basirah HR Department</div>
          </div>
        </div>
        <div class="title">Salary Slip</div>
        <div class="sub">Basirah HR Payroll Statement</div>
      </div>
      <div class="meta">
        <div><strong>Month:</strong> ${month}</div>
        <div><strong>Generated:</strong> ${generatedAt}</div>
      </div>
    </div>

    <table>
      <tr><th>Employee Name</th><td>${employee.fullName}</td></tr>
      <tr><th>Employee ID</th><td>${employee.employeeId}</td></tr>
      <tr><th>Designation</th><td>${employee.designation || "-"}</td></tr>
      <tr><th>Calendar Days In Month</th><td>${daysInMonth}</td></tr>
      <tr><th>Pay From (Join / Period)</th><td>${dutyStart}</td></tr>
      <tr><th>Billable Days This Month</th><td>${eligibleDaysInMonth}</td></tr>
      <tr><th>Approved Leave Days (In Period)</th><td>${approvedLeaveDaysInMonth}</td></tr>
      <tr><th>Worked Days</th><td>${workedDays}</td></tr>
      <tr><th>Paid Leave Days</th><td>${paidLeaveDays}</td></tr>
      <tr><th>Unpaid Leave Days (Deducted)</th><td>${unpaidLeaveDays}</td></tr>
      <tr><th>Payable Days</th><td>${payableDays}</td></tr>
    </table>

    <table class="summary">
      <tr><td>Full Month Salary (Contract)</td><td>${fullMonthSalary.toFixed(2)}</td></tr>
      <tr><td>Prorated Gross (This Month)</td><td>${grossSalary.toFixed(2)}</td></tr>
      <tr><td>Per Day Salary</td><td>${perDaySalary.toFixed(2)}</td></tr>
      <tr><td>Unpaid Leave Deduction</td><td>${unpaidLeaveDeduction.toFixed(2)}</td></tr>
      <tr class="net"><td>Net Salary</td><td>${netSalary.toFixed(2)}</td></tr>
    </table>

    <div class="footer">
      This is a system generated salary slip and does not require a signature.
    </div>
  </section>
</body>
</html>`;

  const safeStamp = generatedAt.replace(/[:.]/g, "-");
  const fileName = `salary-slip-${employee.employeeId}-${month}-${safeStamp}.html`.replace(/\s+/g, "_");
  const absolutePath = path.join(uploadsDir, fileName);
  fs.writeFileSync(absolutePath, slipContent, "utf8");

  const result = db
    .prepare(
      `INSERT INTO salary_slips
       (employeeUserId, title, month, filePath, uploadedAt, generated, workedDays, dayOffs, approvedLeaveDays, unapprovedLeaveDays, paidLeaveDays, unpaidLeaveDays, unpaidLeaveDeduction, grossSalary, netSalary)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      employeeUserId,
      `Auto Slip - ${month}`,
      month,
      `/uploads/${fileName}`,
      generatedAt,
      workedDays,
      0,
      approvedLeaveDaysInMonth,
      0,
      paidLeaveDays,
      unpaidLeaveDays,
      unpaidLeaveDeduction,
      grossSalary,
      netSalary
    );

  const slip = db.prepare("SELECT * FROM salary_slips WHERE id = ?").get(result.lastInsertRowid);
  return { slip };
}

function ensureAutoSlipForMonth(employeeUserId, month) {
  const existing = db
    .prepare("SELECT id FROM salary_slips WHERE employeeUserId = ? AND month = ? LIMIT 1")
    .get(employeeUserId, month);
  if (existing) return;

  const employee = db.prepare("SELECT id FROM users WHERE id = ? AND role != 'admin'").get(employeeUserId);
  if (!employee) return;

  generateAndStoreAutoSlip(employeeUserId, month);
}

module.exports = {
  getSlipLogoDataUri,
  getLastCompletedMonth,
  generateAndStoreAutoSlip,
  ensureAutoSlipForMonth,
};

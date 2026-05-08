const express = require("express");
const fs = require("fs");
const db = require("../db");
const { SUPER_ADMIN_ROLES, STAFF_ROLES } = require("../config/constants");
const { authMiddleware, roleMiddleware } = require("../middleware/auth");
const { upload } = require("../middleware/upload");
const { getMonthlyPayrollBreakdown } = require("../services/payrollService");
const {
  generateAndStoreAutoSlip,
  ensureAutoSlipForMonth,
  getLastCompletedMonth,
} = require("../services/salarySlipService");
const { getMonthRange, toIsoDateOnly } = require("../utils/datePayroll");
const { resolveUploadAbsolute } = require("../utils/uploads");

const router = express.Router();

router.get("/", authMiddleware, (req, res) => {
  const autoMonth = getLastCompletedMonth();

  if (SUPER_ADMIN_ROLES.includes(req.user.role)) {
    const employeeIds = db.prepare("SELECT id FROM users WHERE role != 'admin'").all();
    for (const row of employeeIds) {
      ensureAutoSlipForMonth(row.id, autoMonth);
    }

    const slips = db
      .prepare(
        `SELECT s.*, u.fullName, u.employeeId
         FROM salary_slips s
         JOIN users u ON u.id = s.employeeUserId
         ORDER BY s.id DESC`
      )
      .all();
    return res.json(slips);
  }

  ensureAutoSlipForMonth(req.user.id, autoMonth);
  const slips = db.prepare("SELECT * FROM salary_slips WHERE employeeUserId = ? ORDER BY id DESC").all(req.user.id);
  res.json(slips);
});

router.post("/", authMiddleware, roleMiddleware(SUPER_ADMIN_ROLES), upload.single("slip"), (req, res) => {
  const { employeeUserId, title, month } = req.body;
  if (!employeeUserId || !title || !month || !req.file) {
    return res.status(400).json({ message: "employeeUserId, title, month and PDF file are required" });
  }

  const result = db
    .prepare("INSERT INTO salary_slips (employeeUserId, title, month, filePath, uploadedAt) VALUES (?, ?, ?, ?, ?)")
    .run(employeeUserId, title, month, `/uploads/${req.file.filename}`, new Date().toISOString());

  const slip = db.prepare("SELECT * FROM salary_slips WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(slip);
});

router.post("/generate", authMiddleware, roleMiddleware([...STAFF_ROLES, ...SUPER_ADMIN_ROLES]), (req, res) => {
  const { employeeUserId, month } = req.body || {};
  if (!month) {
    return res.status(400).json({ message: "month is required" });
  }

  const targetEmployeeUserId = SUPER_ADMIN_ROLES.includes(req.user.role) ? employeeUserId : req.user.id;
  if (!targetEmployeeUserId) {
    return res.status(400).json({ message: "employeeUserId is required for admin generation" });
  }

  const result = generateAndStoreAutoSlip(targetEmployeeUserId, month);
  if (result.error) {
    return res.status(result.status || 400).json({ message: result.error });
  }
  res.status(201).json({ slip: result.slip });
});

router.delete("/:id", authMiddleware, roleMiddleware(SUPER_ADMIN_ROLES), (req, res) => {
  const { id } = req.params;
  const slip = db.prepare("SELECT * FROM salary_slips WHERE id = ?").get(id);
  if (!slip) return res.status(404).json({ message: "Slip not found" });

  const absolutePath = resolveUploadAbsolute(slip.filePath);
  if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
  db.prepare("DELETE FROM salary_slips WHERE id = ?").run(id);
  res.json({ success: true });
});

module.exports = router;

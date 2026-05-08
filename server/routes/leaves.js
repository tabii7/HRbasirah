const express = require("express");
const fs = require("fs");
const db = require("../db");
const {
  MANAGEMENT_ROLES,
  STAFF_ROLES,
  LEAVE_APPROVER_ROLES,
  HR_MAX_APPROVAL_DAYS,
} = require("../config/constants");
const { authMiddleware, roleMiddleware } = require("../middleware/auth");
const { upload } = require("../middleware/upload");
const { diffDaysInclusive } = require("../utils/datePayroll");
const { resolveUploadAbsolute } = require("../utils/uploads");

const router = express.Router();

router.get("/", authMiddleware, (req, res) => {
  if (MANAGEMENT_ROLES.includes(req.user.role)) {
    const leaves = db
      .prepare(
        `SELECT l.*, u.fullName, u.employeeId
         FROM leaves l
         JOIN users u ON u.id = l.employeeUserId
         ORDER BY l.id DESC`
      )
      .all();
    return res.json(leaves);
  }

  const leaves = db.prepare("SELECT * FROM leaves WHERE employeeUserId = ? ORDER BY id DESC").all(req.user.id);
  res.json(leaves);
});

router.post("/", authMiddleware, roleMiddleware(STAFF_ROLES), upload.single("supportingDoc"), (req, res) => {
  const payload = req.body || {};
  const { startDate, endDate, leaveType, leaveDetails } = payload;
  if (!startDate || !endDate || !leaveType) {
    return res.status(400).json({ message: "startDate, endDate and leaveType are required" });
  }

  const normalizedType = String(leaveType).trim().toLowerCase();
  if (!["casual", "sick"].includes(normalizedType)) {
    return res.status(400).json({ message: "leaveType must be casual or sick" });
  }

  const leaveDays = diffDaysInclusive(startDate, endDate);
  if (!leaveDays) {
    return res.status(400).json({ message: "Invalid leave date range" });
  }

  const reasonText = normalizedType === "sick" ? "Sick Leave" : "Casual Leave";
  const detailsText = leaveDetails?.trim() || null;
  const supportingDocPath = req.file ? `/uploads/${req.file.filename}` : null;
  const supportingDocUploadedAt = req.file ? new Date().toISOString() : null;

  const result = db
    .prepare(
      `INSERT INTO leaves
       (employeeUserId, startDate, endDate, reason, leaveType, leaveDetails, supportingDocPath, supportingDocUploadedAt, status, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)`
    )
    .run(
      req.user.id,
      startDate,
      endDate,
      reasonText,
      normalizedType,
      detailsText,
      supportingDocPath,
      supportingDocUploadedAt,
      new Date().toISOString()
    );

  const leave = db.prepare("SELECT * FROM leaves WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json({
    ...leave,
    leaveDays,
    requiresSupportingDoc: normalizedType === "sick" && leaveDays > 2,
  });
});

router.patch("/:id/supporting-doc", authMiddleware, upload.single("supportingDoc"), (req, res) => {
  const { id } = req.params;
  if (!req.file) return res.status(400).json({ message: "supportingDoc file is required" });

  const leave = db.prepare("SELECT * FROM leaves WHERE id = ?").get(id);
  if (!leave) return res.status(404).json({ message: "Leave not found" });

  const isManagementUser = MANAGEMENT_ROLES.includes(req.user.role);
  if (!isManagementUser && Number(leave.employeeUserId) !== Number(req.user.id)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (leave.supportingDocPath) {
    const oldPath = resolveUploadAbsolute(leave.supportingDocPath);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  const nextPath = `/uploads/${req.file.filename}`;
  db.prepare("UPDATE leaves SET supportingDocPath = ?, supportingDocUploadedAt = ? WHERE id = ?").run(
    nextPath,
    new Date().toISOString(),
    id
  );

  const updated = db.prepare("SELECT * FROM leaves WHERE id = ?").get(id);
  res.json(updated);
});

router.patch("/:id/status", authMiddleware, roleMiddleware(LEAVE_APPROVER_ROLES), (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;
  if (!["Approved", "Rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }
  if (!note || !String(note).trim()) {
    return res.status(400).json({ message: "Approval/rejection note is required" });
  }

  const leave = db.prepare("SELECT id, startDate, endDate FROM leaves WHERE id = ?").get(id);
  if (!leave) return res.status(404).json({ message: "Leave not found" });

  if (req.user.role === "hr") {
    const start = new Date(`${leave.startDate}T00:00:00`);
    const end = new Date(`${leave.endDate}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
      return res.status(400).json({ message: "Leave has invalid dates" });
    }
    const totalDays = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
    if (totalDays > HR_MAX_APPROVAL_DAYS) {
      return res.status(403).json({
        message: `HR can only approve or reject leaves up to ${HR_MAX_APPROVAL_DAYS} days. Please escalate to a manager or admin.`,
      });
    }
  }

  db.prepare("UPDATE leaves SET status = ?, adminNote = ?, reviewedAt = ? WHERE id = ?").run(
    status,
    String(note).trim(),
    new Date().toISOString(),
    id
  );
  const updatedLeave = db.prepare("SELECT * FROM leaves WHERE id = ?").get(id);
  res.json(updatedLeave);
});

module.exports = router;

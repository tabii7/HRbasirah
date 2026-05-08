const express = require("express");
const db = require("../db");
const { STAFF_ROLES, LETTER_MANAGEMENT_ROLES } = require("../config/constants");
const { authMiddleware, roleMiddleware } = require("../middleware/auth");
const { sendReferenceLetterAdminNotification } = require("../services/referenceLetterMail");
const { generateReferenceLetterPdf } = require("../services/referenceLetterPdf");

const router = express.Router();

router.get("/", authMiddleware, (req, res) => {
  if (LETTER_MANAGEMENT_ROLES.includes(req.user.role)) {
    const rows = db
      .prepare(
        `SELECT r.*, u.fullName, u.employeeId, u.designation
         FROM reference_letters r
         JOIN users u ON u.id = r.employeeUserId
         ORDER BY r.id DESC`
      )
      .all();
    return res.json(rows);
  }
  const rows = db.prepare("SELECT * FROM reference_letters WHERE employeeUserId = ? ORDER BY id DESC").all(req.user.id);
  res.json(rows);
});

router.post("/", authMiddleware, roleMiddleware(STAFF_ROLES), (req, res) => {
  const { purpose, details, addressedTo } = req.body || {};
  if (!purpose || !String(purpose).trim()) {
    return res.status(400).json({ message: "purpose is required" });
  }
  const createdAt = new Date().toISOString();
  const title = `Reference Letter Request - ${String(purpose).trim()}`;
  const result = db
    .prepare(
      `INSERT INTO reference_letters
       (employeeUserId, purpose, details, addressedTo, title, status, createdAt)
       VALUES (?, ?, ?, ?, ?, 'Pending', ?)`
    )
    .run(
      req.user.id,
      String(purpose).trim(),
      details?.trim() || null,
      addressedTo?.trim() || null,
      title,
      createdAt
    );
  const row = db.prepare("SELECT * FROM reference_letters WHERE id = ?").get(result.lastInsertRowid);
  const requestUser = db.prepare("SELECT fullName, employeeId FROM users WHERE id = ?").get(req.user.id);
  sendReferenceLetterAdminNotification({
    employeeName: requestUser?.fullName || "Employee",
    employeeId: requestUser?.employeeId || String(req.user.id),
    purpose: String(purpose).trim(),
    addressedTo: addressedTo?.trim() || null,
    details: details?.trim() || null,
    createdAt,
  }).catch((err) => {
    console.error("Failed to send reference-letter admin notification:", err.message);
  });
  res.status(201).json(row);
});

router.patch("/:id/status", authMiddleware, roleMiddleware(LETTER_MANAGEMENT_ROLES), (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body || {};
  if (!["Approved", "Rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }
  if (!note || !String(note).trim()) {
    return res.status(400).json({ message: "Approval/rejection note is required" });
  }
  const existing = db.prepare("SELECT * FROM reference_letters WHERE id = ?").get(id);
  if (!existing) return res.status(404).json({ message: "Reference letter request not found" });

  db.prepare("UPDATE reference_letters SET status = ?, adminNote = ?, reviewedAt = ? WHERE id = ?").run(
    status,
    String(note).trim(),
    new Date().toISOString(),
    id
  );
  const row = db.prepare("SELECT * FROM reference_letters WHERE id = ?").get(id);
  res.json(row);
});

router.post("/:id/generate", authMiddleware, roleMiddleware(LETTER_MANAGEMENT_ROLES), (req, res) => {
  const { id } = req.params;
  const request = db
    .prepare(
      `SELECT r.*, u.fullName, u.employeeId, u.designation, u.joinedDate
       FROM reference_letters r
       JOIN users u ON u.id = r.employeeUserId
       WHERE r.id = ?`
    )
    .get(id);
  if (!request) return res.status(404).json({ message: "Reference letter request not found" });
  if (request.status !== "Approved") {
    return res.status(400).json({ message: "Approve the request before generating letter" });
  }

  const row = generateReferenceLetterPdf(request, id);
  res.json(row);
});

module.exports = router;

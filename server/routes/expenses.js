const express = require("express");
const db = require("../db");
const { EXPENSE_SUBMIT_ROLES, EXPENSE_VIEW_ROLES, EXPENSE_APPROVE_ROLES } = require("../config/constants");
const { authMiddleware, roleMiddleware } = require("../middleware/auth");
const { upload } = require("../middleware/upload");

const router = express.Router();

function canAccessExpenses(role) {
  return EXPENSE_SUBMIT_ROLES.includes(role) || EXPENSE_VIEW_ROLES.includes(role);
}

router.get("/", authMiddleware, (req, res) => {
  if (!canAccessExpenses(req.user.role)) {
    return res.status(403).json({ message: "You do not have access to expenses." });
  }

  if (EXPENSE_VIEW_ROLES.includes(req.user.role)) {
    const rows = db
      .prepare(
        `SELECT e.*, u.fullName, u.employeeId, u.designation, u.role AS submitterRole
         FROM expenses e
         JOIN users u ON u.id = e.submittedByUserId
         ORDER BY e.id DESC`
      )
      .all();
    return res.json(rows);
  }

  const rows = db
    .prepare("SELECT * FROM expenses WHERE submittedByUserId = ? ORDER BY id DESC")
    .all(req.user.id);
  res.json(rows);
});

router.post("/", authMiddleware, roleMiddleware(EXPENSE_SUBMIT_ROLES), upload.single("receipt"), (req, res) => {
  const payload = req.body || {};
  const { title, amount, expenseDate, description } = payload;

  if (!title || !String(title).trim()) {
    return res.status(400).json({ message: "title is required" });
  }
  if (!expenseDate || !String(expenseDate).trim()) {
    return res.status(400).json({ message: "expenseDate is required" });
  }

  const parsedAmount = Number(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ message: "amount must be a positive number" });
  }

  const createdAt = new Date().toISOString();
  const receiptPath = req.file ? `/uploads/${req.file.filename}` : null;

  const result = db
    .prepare(
      `INSERT INTO expenses
       (submittedByUserId, title, amount, expenseDate, description, receiptPath, status, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?)`
    )
    .run(
      req.user.id,
      String(title).trim(),
      parsedAmount,
      String(expenseDate).trim(),
      description?.trim() || null,
      receiptPath,
      createdAt
    );

  const row = db.prepare("SELECT * FROM expenses WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(row);
});

router.patch("/:id/status", authMiddleware, roleMiddleware(EXPENSE_APPROVE_ROLES), (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body || {};
  if (!["Approved", "Rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }
  if (!note || !String(note).trim()) {
    return res.status(400).json({ message: "Approval/rejection note is required" });
  }

  const existing = db.prepare("SELECT * FROM expenses WHERE id = ?").get(id);
  if (!existing) return res.status(404).json({ message: "Expense not found" });
  if (existing.status !== "Pending") {
    return res.status(400).json({ message: "Only pending expenses can be reviewed" });
  }

  db.prepare("UPDATE expenses SET status = ?, adminNote = ?, reviewedAt = ? WHERE id = ?").run(
    status,
    String(note).trim(),
    new Date().toISOString(),
    id
  );
  const row = db.prepare("SELECT * FROM expenses WHERE id = ?").get(id);
  res.json(row);
});

module.exports = router;

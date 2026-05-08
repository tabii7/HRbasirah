const express = require("express");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const db = require("../db");
const { MANAGEMENT_ROLES, STAFF_ROLES } = require("../config/constants");
const { authMiddleware, roleMiddleware } = require("../middleware/auth");
const { upload } = require("../middleware/upload");
const { generateEmployeeId } = require("../services/employeeService");
const { resolveUploadAbsolute } = require("../utils/uploads");

const router = express.Router();

router.get("/", authMiddleware, roleMiddleware(MANAGEMENT_ROLES), (_req, res) => {
  const employees = db
    .prepare(
      "SELECT id, employeeId, fullName, email, role, birthdate, designation, phone, address, joinedDate, idFrontPath, idBackPath, employmentLetterPath, monthlySalary FROM users WHERE role != 'admin' ORDER BY id DESC"
    )
    .all();
  res.json(employees);
});

router.post(
  "/",
  authMiddleware,
  roleMiddleware(MANAGEMENT_ROLES),
  upload.fields([{ name: "idFront", maxCount: 1 }, { name: "idBack", maxCount: 1 }, { name: "employmentLetter", maxCount: 1 }]),
  (req, res) => {
    const payload = req.body || {};
    const { employeeId, fullName, email, password, birthdate, designation, role, phone, address, joinedDate, monthlySalary } = payload;
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "fullName, email and password are required" });
    }
    const normalizedRole = String(role || "employee").trim().toLowerCase();
    if (!STAFF_ROLES.includes(normalizedRole)) {
      return res.status(400).json({ message: "Invalid role. Allowed roles: employee, hr, manager, general_manager" });
    }

    try {
      const passwordHash = bcrypt.hashSync(password, 10);
      const finalEmployeeId = employeeId?.trim() ? employeeId : generateEmployeeId();
      const idFrontPath = req.files?.idFront?.[0] ? `/uploads/${req.files.idFront[0].filename}` : null;
      const idBackPath = req.files?.idBack?.[0] ? `/uploads/${req.files.idBack[0].filename}` : null;
      const employmentLetterPath = req.files?.employmentLetter?.[0] ? `/uploads/${req.files.employmentLetter[0].filename}` : null;
      const result = db
        .prepare(
          `INSERT INTO users (employeeId, fullName, email, passwordHash, role, birthdate, designation, phone, address, joinedDate, idFrontPath, idBackPath, employmentLetterPath, monthlySalary)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          finalEmployeeId,
          fullName,
          email,
          passwordHash,
          normalizedRole,
          birthdate || null,
          designation || null,
          phone || null,
          address || null,
          joinedDate || null,
          idFrontPath,
          idBackPath,
          employmentLetterPath,
          monthlySalary ? Number(monthlySalary) : null
        );

      const created = db
        .prepare(
          "SELECT id, employeeId, fullName, email, role, birthdate, designation, phone, address, joinedDate, idFrontPath, idBackPath, employmentLetterPath, monthlySalary FROM users WHERE id = ?"
        )
        .get(result.lastInsertRowid);
      res.status(201).json(created);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(MANAGEMENT_ROLES),
  upload.fields([{ name: "idFront", maxCount: 1 }, { name: "idBack", maxCount: 1 }, { name: "employmentLetter", maxCount: 1 }]),
  (req, res) => {
    const { id } = req.params;
    const payload = req.body || {};
    const { fullName, email, birthdate, designation, role, phone, address, joinedDate, monthlySalary } = payload;
    if (!fullName || !email) {
      return res.status(400).json({ message: "fullName and email are required" });
    }
    const normalizedRole = String(role || "employee").trim().toLowerCase();
    if (!STAFF_ROLES.includes(normalizedRole)) {
      return res.status(400).json({ message: "Invalid role. Allowed roles: employee, hr, manager, general_manager" });
    }
    const current = db.prepare("SELECT idFrontPath, idBackPath, employmentLetterPath FROM users WHERE id = ? AND role != 'admin'").get(id);
    if (!current) return res.status(404).json({ message: "Employee not found" });

    const idFrontPath = req.files?.idFront?.[0] ? `/uploads/${req.files.idFront[0].filename}` : current.idFrontPath;
    const idBackPath = req.files?.idBack?.[0] ? `/uploads/${req.files.idBack[0].filename}` : current.idBackPath;
    const employmentLetterPath = req.files?.employmentLetter?.[0]
      ? `/uploads/${req.files.employmentLetter[0].filename}`
      : current.employmentLetterPath;

    if (req.files?.idFront?.[0] && current.idFrontPath) {
      const oldFront = resolveUploadAbsolute(current.idFrontPath);
      if (fs.existsSync(oldFront)) fs.unlinkSync(oldFront);
    }
    if (req.files?.idBack?.[0] && current.idBackPath) {
      const oldBack = resolveUploadAbsolute(current.idBackPath);
      if (fs.existsSync(oldBack)) fs.unlinkSync(oldBack);
    }
    if (req.files?.employmentLetter?.[0] && current.employmentLetterPath) {
      const oldLetter = resolveUploadAbsolute(current.employmentLetterPath);
      if (fs.existsSync(oldLetter)) fs.unlinkSync(oldLetter);
    }

    db.prepare(
      `UPDATE users SET fullName = ?, email = ?, birthdate = ?, designation = ?, role = ?, phone = ?, address = ?, joinedDate = ?, idFrontPath = ?, idBackPath = ?, employmentLetterPath = ?, monthlySalary = ?
     WHERE id = ? AND role != 'admin'`
    ).run(
      fullName,
      email,
      birthdate || null,
      designation || null,
      normalizedRole,
      phone || null,
      address || null,
      joinedDate || null,
      idFrontPath,
      idBackPath,
      employmentLetterPath,
      monthlySalary ? Number(monthlySalary) : null,
      id
    );

    const updated = db
      .prepare(
        "SELECT id, employeeId, fullName, email, role, birthdate, designation, phone, address, joinedDate, idFrontPath, idBackPath, employmentLetterPath, monthlySalary FROM users WHERE id = ?"
      )
      .get(id);
    res.json(updated);
  }
);

router.delete("/:id", authMiddleware, roleMiddleware(MANAGEMENT_ROLES), (req, res) => {
  const { id } = req.params;
  const employee = db.prepare("SELECT idFrontPath, idBackPath, employmentLetterPath FROM users WHERE id = ? AND role != 'admin'").get(id);
  if (employee?.idFrontPath) {
    const frontPath = resolveUploadAbsolute(employee.idFrontPath);
    if (fs.existsSync(frontPath)) fs.unlinkSync(frontPath);
  }
  if (employee?.idBackPath) {
    const backPath = resolveUploadAbsolute(employee.idBackPath);
    if (fs.existsSync(backPath)) fs.unlinkSync(backPath);
  }
  if (employee?.employmentLetterPath) {
    const letterPath = resolveUploadAbsolute(employee.employmentLetterPath);
    if (fs.existsSync(letterPath)) fs.unlinkSync(letterPath);
  }
  db.prepare("DELETE FROM users WHERE id = ? AND role != 'admin'").run(id);
  res.json({ success: true });
});

module.exports = router;

const express = require("express");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const db = require("../db");
const { MANAGEMENT_ROLES, STAFF_ROLES } = require("../config/constants");
const { authMiddleware, roleMiddleware } = require("../middleware/auth");
const { upload } = require("../middleware/upload");
const { generateEmployeeId, deleteEmployeeById } = require("../services/employeeService");
const { resolveUploadAbsolute } = require("../utils/uploads");
const { validateEmployeePayload } = require("../utils/employeeValidation");

function cleanupUploadedFiles(files) {
  if (!files) return;
  Object.values(files).forEach((fileList) => {
    fileList?.forEach((file) => {
      const absolute = resolveUploadAbsolute(`/uploads/${file.filename}`);
      if (fs.existsSync(absolute)) fs.unlinkSync(absolute);
    });
  });
}

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

    const validation = validateEmployeePayload(payload, {
      requirePassword: true,
      files: req.files,
    });
    if (!validation.valid) {
      cleanupUploadedFiles(req.files);
      return res.status(400).json({ message: validation.message, errors: validation.errors });
    }

    const normalizedRole = String(role || "employee").trim().toLowerCase();
    if (!STAFF_ROLES.includes(normalizedRole)) {
      cleanupUploadedFiles(req.files);
      return res.status(400).json({ message: "Invalid role. Allowed roles: employee, hr, manager, general_manager" });
    }

    try {
      const passwordValue = String(password).trim();
      const passwordHash = bcrypt.hashSync(passwordValue, 10);
      const finalEmployeeId = employeeId?.trim() ? employeeId : generateEmployeeId();
      const cleanName = String(fullName).trim();
      const cleanEmail = String(email).trim();
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
          cleanName,
          cleanEmail,
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
      const raw = String(err.message || "");
      let message = raw;
      if (raw.includes("UNIQUE constraint failed: users.email")) {
        message = "A user with this email already exists";
      } else if (raw.includes("UNIQUE constraint failed: users.employeeId")) {
        message = "This employee ID is already in use";
      }
      res.status(400).json({ message });
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
    const current = db.prepare("SELECT idFrontPath, idBackPath, employmentLetterPath FROM users WHERE id = ? AND role != 'admin'").get(id);
    if (!current) return res.status(404).json({ message: "Employee not found" });

    const validation = validateEmployeePayload(payload, {
      requirePassword: false,
      files: req.files,
      current,
    });
    if (!validation.valid) {
      cleanupUploadedFiles(req.files);
      return res.status(400).json({ message: validation.message, errors: validation.errors });
    }

    const normalizedRole = String(role || "employee").trim().toLowerCase();
    if (!STAFF_ROLES.includes(normalizedRole)) {
      cleanupUploadedFiles(req.files);
      return res.status(400).json({ message: "Invalid role. Allowed roles: employee, hr, manager, general_manager" });
    }

    const cleanName = String(fullName).trim();
    const cleanEmail = String(email).trim();

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
      cleanName,
      cleanEmail,
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
  try {
    const result = deleteEmployeeById(req.params.id);
    if (!result.ok) {
      return res.status(result.status || 400).json({ message: result.message });
    }
    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message || "Could not delete user" });
  }
});

module.exports = router;

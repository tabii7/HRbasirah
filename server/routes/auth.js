const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { JWT_SECRET } = require("../config/constants");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = db
    .prepare("SELECT id, employeeId, fullName, email, passwordHash, role, designation FROM users WHERE email = ?")
    .get(email);

  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "12h" });
  res.json({
    token,
    user: {
      id: user.id,
      employeeId: user.employeeId,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      designation: user.designation,
    },
  });
});

router.get("/me", authMiddleware, (req, res) => {
  const user = db
    .prepare(
      "SELECT id, employeeId, fullName, email, role, birthdate, designation, phone, address, joinedDate, idFrontPath, idBackPath, employmentLetterPath FROM users WHERE id = ?"
    )
    .get(req.user.id);
  res.json(user);
});

module.exports = router;

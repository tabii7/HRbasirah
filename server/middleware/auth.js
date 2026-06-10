const jwt = require("jsonwebtoken");
const db = require("../db");
const { JWT_SECRET } = require("../config/constants");

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token provided" });
  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Invalid auth header" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const row = db.prepare("SELECT id, role FROM users WHERE id = ?").get(payload.id);
    if (!row) return res.status(401).json({ message: "User not found" });
    req.user = { id: row.id, role: row.role };
    next();
  } catch (_err) {
    res.status(401).json({ message: "Invalid token" });
  }
}

function roleMiddleware(role) {
  const roles = Array.isArray(role) ? role : [role];
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied for role "${req.user.role}". Log out and sign in again, or ask an administrator.`,
      });
    }
    next();
  };
}

module.exports = { authMiddleware, roleMiddleware };

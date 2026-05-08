const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/constants");

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token provided" });
  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Invalid auth header" });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (_err) {
    res.status(401).json({ message: "Invalid token" });
  }
}

function roleMiddleware(role) {
  const roles = Array.isArray(role) ? role : [role];
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: "Forbidden" });
    next();
  };
}

module.exports = { authMiddleware, roleMiddleware };

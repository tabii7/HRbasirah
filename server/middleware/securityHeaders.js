function securityHeaders(_req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
}

module.exports = { securityHeaders };

const express = require("express");
const cors = require("cors");

require("./db");

const { uploadsDir } = require("./config/paths");
const { CLIENT_URL } = require("./config/constants");
const { securityHeaders } = require("./middleware/securityHeaders");
const authRoutes = require("./routes/auth");
const employeeRoutes = require("./routes/employees");
const leavesRoutes = require("./routes/leaves");
const referenceLettersRoutes = require("./routes/referenceLetters");
const salarySlipsRoutes = require("./routes/salarySlips");
const payrollRoutes = require("./routes/payroll");
const expensesRoutes = require("./routes/expenses");

const app = express();

app.use(securityHeaders);

const allowedOrigins = (CLIENT_URL || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const corsOptions = allowedOrigins.length
  ? {
      origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
    }
  : {};

app.use(cors(corsOptions));
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/leaves", leavesRoutes);
app.use("/api/reference-letters", referenceLettersRoutes);
app.use("/api/salary-slips", salarySlipsRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/expenses", expensesRoutes);

module.exports = app;

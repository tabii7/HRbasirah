const PORT = Number(process.env.PORT) || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_change_me";
const CLIENT_URL = process.env.CLIENT_URL || "";

const MANAGEMENT_ROLES = ["admin", "hr", "manager", "general_manager"];
const LEAVE_APPROVER_ROLES = ["admin", "hr", "manager", "general_manager"];
const HR_MAX_APPROVAL_DAYS = 4;
const SUPER_ADMIN_ROLES = ["admin"];
const LETTER_MANAGEMENT_ROLES = ["admin"];
const EXPENSE_SUBMIT_ROLES = ["admin", "hr", "manager", "general_manager"];
const EXPENSE_VIEW_ROLES = ["admin"];
const EXPENSE_APPROVE_ROLES = ["admin"];
const STAFF_ROLES = ["employee", "hr", "manager", "general_manager"];
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@basirah.local";

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  console.warn("[config] WARNING: JWT_SECRET is not set in production. Set it via environment variables.");
}

module.exports = {
  PORT,
  JWT_SECRET,
  CLIENT_URL,
  MANAGEMENT_ROLES,
  LEAVE_APPROVER_ROLES,
  HR_MAX_APPROVAL_DAYS,
  SUPER_ADMIN_ROLES,
  LETTER_MANAGEMENT_ROLES,
  EXPENSE_SUBMIT_ROLES,
  EXPENSE_VIEW_ROLES,
  EXPENSE_APPROVE_ROLES,
  STAFF_ROLES,
  ADMIN_EMAIL,
};

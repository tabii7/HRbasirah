/** Letters, spaces, apostrophe, hyphen, period — no digits or symbols */
export const PERSON_NAME_REGEX = /^[a-zA-Z\s.'-]+$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^\+?[0-9\s-]{7,20}$/;
export const MIN_PASSWORD_LENGTH = 6;

/** Strip digits and invalid characters as the user types */
export function sanitizePersonName(value) {
  return String(value || "").replace(/[^a-zA-Z\s.'-]/g, "");
}

/** Digits, spaces, + and - only */
export function sanitizePhone(value) {
  return String(value || "").replace(/[^0-9+\s-]/g, "");
}

/** Positive decimal salary */
export function sanitizeSalary(value) {
  const cleaned = String(value || "").replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length <= 1) return parts[0];
  return `${parts[0]}.${parts.slice(1).join("")}`;
}

/** General text: letters, numbers, spaces, basic punctuation */
export function sanitizeGeneralText(value) {
  return String(value || "").replace(/[^a-zA-Z0-9\s.,'/-]/g, "");
}

export function validatePersonName(value, { required = true, label = "Full Name" } = {}) {
  const name = String(value || "").trim();
  if (!name) return required ? `${label} is required` : null;
  if (!PERSON_NAME_REGEX.test(name)) {
    return `${label} must not contain special characters or numbers`;
  }
  if (name.length < 2) return `${label} must be at least 2 characters`;
  return null;
}

export function validateEmail(value, { required = true } = {}) {
  const email = String(value || "").trim();
  if (!email) return required ? "Email is required" : null;
  if (!EMAIL_REGEX.test(email)) return "Enter a valid email address";
  return null;
}

export function validatePassword(value, { required = false } = {}) {
  const pwd = String(value || "").trim();
  if (!pwd) return required ? "Password is required" : null;
  if (pwd.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  return null;
}

export function validatePhone(value, { required = false } = {}) {
  const phone = String(value || "").trim();
  if (!phone) return required ? "Phone number is required" : null;
  if (!PHONE_REGEX.test(phone)) return "Enter a valid phone number";
  return null;
}

export function validateRequiredText(value, label) {
  if (!String(value || "").trim()) return `${label} is required`;
  return null;
}

export function validateSalary(value, { required = false } = {}) {
  const raw = String(value || "").trim();
  if (!raw) return required ? "Monthly salary is required" : null;
  const num = Number(raw);
  if (!Number.isFinite(num) || num <= 0) return "Enter a valid monthly salary";
  return null;
}

export function validateLoginForm(form) {
  const errors = {};
  const emailError = validateEmail(form.email, { required: true });
  if (emailError) errors.email = emailError;
  const passwordError = validatePassword(form.password, { required: true });
  if (passwordError) errors.password = passwordError;
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateLeaveForm(form) {
  const errors = {};
  if (!form.startDate) errors.startDate = "Start date is required";
  if (!form.endDate) errors.endDate = "End date is required";
  if (form.startDate && form.endDate) {
    const start = new Date(`${form.startDate}T00:00:00`);
    const end = new Date(`${form.endDate}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      errors.endDate = "Enter valid dates";
    } else if (end < start) {
      errors.endDate = "End date cannot be before start date";
    }
  }
  const leaveType = String(form.leaveType || "").toLowerCase();
  if (!leaveType) errors.leaveType = "Leave type is required";

  let leaveDays = 0;
  if (form.startDate && form.endDate) {
    const start = new Date(`${form.startDate}T00:00:00`);
    const end = new Date(`${form.endDate}T00:00:00`);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end >= start) {
      leaveDays = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
    }
  }
  if (leaveType === "sick" && leaveDays > 2 && !form.supportingDoc) {
    errors.supportingDoc = "Doctor slip/report is required for sick leave over 2 days";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateReferenceForm(form) {
  const errors = {};
  const purpose = String(form.purpose || "").trim();
  if (!purpose) errors.purpose = "Purpose is required";
  else if (purpose.length < 3) errors.purpose = "Purpose must be at least 3 characters";
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validatePayrollSelection(form) {
  const errors = {};
  if (!form.month) errors.month = "Month is required";
  return { valid: Object.keys(errors).length === 0, errors };
}

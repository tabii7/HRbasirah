const FULL_NAME_REGEX = /^[a-zA-Z\s.'-]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9\s-]{7,20}$/;
const MIN_PASSWORD_LENGTH = 6;

function validateFullName(fullName) {
  const name = String(fullName || "").trim();
  if (!name) return "Full Name is required";
  if (!FULL_NAME_REGEX.test(name)) {
    return "Full Name must not contain special characters or numbers";
  }
  return null;
}

function validateEmail(email) {
  const value = String(email || "").trim();
  if (!value) return "Email is required";
  if (!EMAIL_REGEX.test(value)) return "Enter a valid email address";
  return null;
}

function validatePassword(password, { required }) {
  const value = String(password || "").trim();
  if (!required) {
    if (!value) return null;
    if (value.length < MIN_PASSWORD_LENGTH) {
      return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    }
    return null;
  }
  if (!value) return "Password is required";
  if (value.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  return null;
}

function validateRequired(value, label) {
  if (!String(value || "").trim()) return `${label} is required`;
  return null;
}

function validatePhone(phone) {
  const value = String(phone || "").trim();
  if (!value) return "Phone number is required";
  if (!PHONE_REGEX.test(value)) return "Enter a valid phone number";
  return null;
}

function validateSalary(monthlySalary) {
  const raw = String(monthlySalary ?? "").trim();
  if (!raw) return "Monthly salary is required";
  const num = Number(raw);
  if (!Number.isFinite(num) || num <= 0) return "Enter a valid monthly salary";
  return null;
}

function validateCreateDocuments(files) {
  const errors = {};
  if (!files?.idFront?.[0]) errors.idFront = "ID Front is required";
  if (!files?.idBack?.[0]) errors.idBack = "ID Back is required";
  if (!files?.employmentLetter?.[0]) errors.employmentLetter = "Employment Letter is required";
  return errors;
}

function validateUpdateDocuments(files, current) {
  const errors = {};
  const hasFront = Boolean(files?.idFront?.[0] || current?.idFrontPath);
  const hasBack = Boolean(files?.idBack?.[0] || current?.idBackPath);
  const hasLetter = Boolean(files?.employmentLetter?.[0] || current?.employmentLetterPath);
  if (!hasFront) errors.idFront = "ID Front is required";
  if (!hasBack) errors.idBack = "ID Back is required";
  if (!hasLetter) errors.employmentLetter = "Employment Letter is required";
  return errors;
}

function validateEmployeePayload(payload, options = {}) {
  const { requirePassword = false, files = null, current = null } = options;
  const errors = {};

  const fullNameError = validateFullName(payload?.fullName);
  if (fullNameError) errors.fullName = fullNameError;

  const emailError = validateEmail(payload?.email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(payload?.password, { required: requirePassword });
  if (passwordError) errors.password = passwordError;

  const birthdateError = validateRequired(payload?.birthdate, "Birth Date");
  if (birthdateError) errors.birthdate = birthdateError;

  const designationError = validateRequired(payload?.designation, "Designation");
  if (designationError) errors.designation = designationError;

  const phoneError = validatePhone(payload?.phone);
  if (phoneError) errors.phone = phoneError;

  const joinedDateError = validateRequired(payload?.joinedDate, "Joined Date");
  if (joinedDateError) errors.joinedDate = joinedDateError;

  const salaryError = validateSalary(payload?.monthlySalary);
  if (salaryError) errors.monthlySalary = salaryError;

  const addressError = validateRequired(payload?.address, "Address");
  if (addressError) errors.address = addressError;

  const docErrors = current ? validateUpdateDocuments(files, current) : validateCreateDocuments(files);
  Object.assign(errors, docErrors);

  const messages = Object.values(errors);
  return {
    valid: messages.length === 0,
    errors,
    message: messages.length ? messages.join(". ") : null,
  };
}

module.exports = {
  validateEmployeePayload,
  FULL_NAME_REGEX,
};

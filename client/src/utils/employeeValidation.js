import {
  MIN_PASSWORD_LENGTH,
  validateEmail,
  validatePassword,
  validatePersonName,
  validatePhone,
  validateRequiredText,
  validateSalary,
} from "./formValidation";

export { MIN_PASSWORD_LENGTH };

export function validateEmployeeForm(form, { isEdit = false, hasIdFront = false, hasIdBack = false, hasEmploymentLetter = false } = {}) {
  const errors = {};

  const fullNameError = validatePersonName(form.fullName, { required: true, label: "Full Name" });
  if (fullNameError) errors.fullName = fullNameError;

  const emailError = validateEmail(form.email, { required: true });
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(form.password, { required: !isEdit });
  if (passwordError) errors.password = passwordError;

  const birthdateError = validateRequiredText(form.birthdate, "Birth Date");
  if (birthdateError) errors.birthdate = birthdateError;

  const designationError = validateRequiredText(form.designation, "Designation");
  if (designationError) errors.designation = designationError;

  const phoneError = validatePhone(form.phone, { required: true });
  if (phoneError) errors.phone = phoneError;

  const joinedDateError = validateRequiredText(form.joinedDate, "Joined Date");
  if (joinedDateError) errors.joinedDate = joinedDateError;

  const salaryError = validateSalary(form.monthlySalary, { required: true });
  if (salaryError) errors.monthlySalary = salaryError;

  const addressError = validateRequiredText(form.address, "Address");
  if (addressError) errors.address = addressError;

  if (!form.idFront && !hasIdFront) errors.idFront = "ID Front is required";
  if (!form.idBack && !hasIdBack) errors.idBack = "ID Back is required";
  if (!form.employmentLetter && !hasEmploymentLetter) {
    errors.employmentLetter = "Employment Letter is required";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

const fs = require("fs");
const db = require("../db");
const { resolveUploadAbsolute } = require("../utils/uploads");

function generateEmployeeId() {
  const ids = db
    .prepare("SELECT employeeId FROM users WHERE role != 'admin' AND employeeId IS NOT NULL")
    .all()
    .map((row) => row.employeeId);
  const maxNumber = ids.reduce((max, value) => {
    const match = /^EMP-(\d+)$/.exec(value || "");
    if (!match) return max;
    return Math.max(max, Number(match[1]));
  }, 0);
  const next = String(maxNumber + 1).padStart(4, "0");
  return `EMP-${next}`;
}

function unlinkIfExists(relativePath) {
  if (!relativePath) return;
  try {
    const absolute = resolveUploadAbsolute(relativePath);
    if (fs.existsSync(absolute)) fs.unlinkSync(absolute);
  } catch (_err) {
    // Best-effort file cleanup; DB delete should still proceed.
  }
}

function deleteEmployeeById(userId) {
  const id = Number(userId);
  if (!Number.isFinite(id)) {
    return { ok: false, status: 400, message: "Invalid user id" };
  }

  const employee = db
    .prepare("SELECT id, role, idFrontPath, idBackPath, employmentLetterPath FROM users WHERE id = ?")
    .get(id);

  if (!employee) {
    return { ok: false, status: 404, message: "Employee not found" };
  }
  if (employee.role === "admin") {
    return { ok: false, status: 403, message: "Cannot delete admin user" };
  }

  const runDelete = db.transaction((employeeId) => {
    const leaves = db.prepare("SELECT supportingDocPath FROM leaves WHERE employeeUserId = ?").all(employeeId);
    leaves.forEach((row) => unlinkIfExists(row.supportingDocPath));
    db.prepare("DELETE FROM leaves WHERE employeeUserId = ?").run(employeeId);

    const slips = db.prepare("SELECT filePath FROM salary_slips WHERE employeeUserId = ?").all(employeeId);
    slips.forEach((row) => unlinkIfExists(row.filePath));
    db.prepare("DELETE FROM salary_slips WHERE employeeUserId = ?").run(employeeId);

    const letters = db.prepare("SELECT filePath FROM reference_letters WHERE employeeUserId = ?").all(employeeId);
    letters.forEach((row) => unlinkIfExists(row.filePath));
    db.prepare("DELETE FROM reference_letters WHERE employeeUserId = ?").run(employeeId);

    unlinkIfExists(employee.idFrontPath);
    unlinkIfExists(employee.idBackPath);
    unlinkIfExists(employee.employmentLetterPath);

    return db.prepare("DELETE FROM users WHERE id = ? AND role != 'admin'").run(employeeId).changes;
  });

  const changes = runDelete(id);
  if (!changes) {
    return { ok: false, status: 404, message: "Employee not found" };
  }

  return { ok: true };
}

module.exports = { generateEmployeeId, deleteEmployeeById };

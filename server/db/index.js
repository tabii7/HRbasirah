const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const { dbPath } = require("../config/paths");
const { ADMIN_EMAIL } = require("../config/constants");

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employeeId TEXT UNIQUE,
    fullName TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'employee', 'hr', 'manager', 'general_manager')),
    birthdate TEXT,
    designation TEXT,
    phone TEXT,
    address TEXT,
    joinedDate TEXT
  );

  CREATE TABLE IF NOT EXISTS leaves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employeeUserId INTEGER NOT NULL,
    startDate TEXT NOT NULL,
    endDate TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'Approved', 'Rejected')),
    createdAt TEXT NOT NULL,
    FOREIGN KEY(employeeUserId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS salary_slips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employeeUserId INTEGER NOT NULL,
    title TEXT NOT NULL,
    month TEXT NOT NULL,
    filePath TEXT NOT NULL,
    uploadedAt TEXT NOT NULL,
    FOREIGN KEY(employeeUserId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS reference_letters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employeeUserId INTEGER NOT NULL,
    purpose TEXT NOT NULL,
    details TEXT,
    addressedTo TEXT,
    title TEXT,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'Approved', 'Rejected')),
    adminNote TEXT,
    filePath TEXT,
    createdAt TEXT NOT NULL,
    reviewedAt TEXT,
    generatedAt TEXT,
    FOREIGN KEY(employeeUserId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    submittedByUserId INTEGER NOT NULL,
    title TEXT NOT NULL,
    amount REAL NOT NULL,
    expenseDate TEXT NOT NULL,
    description TEXT,
    receiptPath TEXT,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'Approved', 'Rejected')),
    adminNote TEXT,
    reviewedAt TEXT,
    createdAt TEXT NOT NULL,
    FOREIGN KEY(submittedByUserId) REFERENCES users(id)
  );
`);

function ensureUsersRoleConstraint() {
  const table = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'users'").get();
  const sql = table?.sql || "";
  if (sql.includes("general_manager")) return;

  db.pragma("foreign_keys = OFF");
  try {
    db.exec(`
      BEGIN TRANSACTION;
      CREATE TABLE users_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employeeId TEXT UNIQUE,
        fullName TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'employee', 'hr', 'manager', 'general_manager')),
        birthdate TEXT,
        designation TEXT,
        phone TEXT,
        address TEXT,
        joinedDate TEXT,
        idFrontPath TEXT,
        idBackPath TEXT,
        employmentLetterPath TEXT,
        monthlySalary REAL
      );
      INSERT INTO users_new (id, employeeId, fullName, email, passwordHash, role, birthdate, designation, phone, address, joinedDate, idFrontPath, idBackPath, employmentLetterPath, monthlySalary)
      SELECT id, employeeId, fullName, email, passwordHash, role, birthdate, designation, phone, address, joinedDate, idFrontPath, idBackPath, employmentLetterPath, monthlySalary
      FROM users;
      DROP TABLE users;
      ALTER TABLE users_new RENAME TO users;
      COMMIT;
    `);
  } catch (err) {
    try {
      db.exec("ROLLBACK;");
    } catch (_rollbackErr) {
      // Ignore nested rollback errors.
    }
    throw err;
  } finally {
    db.pragma("foreign_keys = ON");
  }
}

function ensureColumn(table, column, type) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((col) => col.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
  }
}

ensureColumn("users", "idFrontPath", "TEXT");
ensureColumn("users", "idBackPath", "TEXT");
ensureColumn("users", "employmentLetterPath", "TEXT");
ensureColumn("users", "monthlySalary", "REAL");
ensureUsersRoleConstraint();
ensureColumn("leaves", "adminNote", "TEXT");
ensureColumn("leaves", "reviewedAt", "TEXT");
ensureColumn("leaves", "leaveType", "TEXT");
ensureColumn("leaves", "leaveDetails", "TEXT");
ensureColumn("leaves", "supportingDocPath", "TEXT");
ensureColumn("leaves", "supportingDocUploadedAt", "TEXT");
ensureColumn("reference_letters", "details", "TEXT");
ensureColumn("reference_letters", "addressedTo", "TEXT");
ensureColumn("reference_letters", "title", "TEXT");
ensureColumn("reference_letters", "adminNote", "TEXT");
ensureColumn("reference_letters", "filePath", "TEXT");
ensureColumn("reference_letters", "reviewedAt", "TEXT");
ensureColumn("reference_letters", "generatedAt", "TEXT");
ensureColumn("salary_slips", "generated", "INTEGER DEFAULT 0");
ensureColumn("salary_slips", "workedDays", "INTEGER");
ensureColumn("salary_slips", "dayOffs", "INTEGER");
ensureColumn("salary_slips", "approvedLeaveDays", "INTEGER");
ensureColumn("salary_slips", "unapprovedLeaveDays", "INTEGER");
ensureColumn("salary_slips", "paidLeaveDays", "INTEGER");
ensureColumn("salary_slips", "unpaidLeaveDays", "INTEGER");
ensureColumn("salary_slips", "unpaidLeaveDeduction", "REAL");
ensureColumn("salary_slips", "grossSalary", "REAL");
ensureColumn("salary_slips", "netSalary", "REAL");
ensureColumn("expenses", "status", "TEXT");
ensureColumn("expenses", "adminNote", "TEXT");
ensureColumn("expenses", "reviewedAt", "TEXT");
db.prepare("UPDATE expenses SET status = 'Pending' WHERE status IS NULL OR status = ''").run();

const existingAdmin = db.prepare("SELECT id FROM users WHERE email = ?").get(ADMIN_EMAIL);
if (!existingAdmin) {
  const passwordHash = bcrypt.hashSync("admin123", 10);
  db.prepare(
    `INSERT INTO users (employeeId, fullName, email, passwordHash, role, designation, joinedDate)
     VALUES (?, ?, ?, ?, 'admin', ?, ?)`
  ).run("ADM-001", "System Admin", ADMIN_EMAIL, passwordHash, "Administrator", new Date().toISOString());
}

module.exports = db;

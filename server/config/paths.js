const path = require("path");
const fs = require("fs");

const root = path.join(__dirname, "..");

function resolveDir(envValue, fallback) {
  if (!envValue) return fallback;
  return path.isAbsolute(envValue) ? envValue : path.join(root, envValue);
}

const dataDir = resolveDir(process.env.DATA_DIR, path.join(root, "data"));
const uploadsDir = resolveDir(process.env.UPLOADS_DIR, path.join(root, "uploads"));

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const dbPath = path.join(dataDir, "hr.db");

const localAssetsDir = path.join(root, "assets");
const fallbackClientPublicDir = path.join(root, "..", "client", "public");
const logoPath =
  (process.env.LOGO_PATH && (path.isAbsolute(process.env.LOGO_PATH) ? process.env.LOGO_PATH : path.join(root, process.env.LOGO_PATH))) ||
  (fs.existsSync(path.join(localAssetsDir, "logo.png"))
    ? path.join(localAssetsDir, "logo.png")
    : path.join(fallbackClientPublicDir, "logo.png"));

module.exports = {
  root,
  dataDir,
  uploadsDir,
  dbPath,
  logoPath,
};

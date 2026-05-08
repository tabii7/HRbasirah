const path = require("path");
const { uploadsDir } = require("../config/paths");

function resolveUploadAbsolute(storedPath) {
  const relative = String(storedPath || "").replace(/^\/uploads\/?/, "");
  return path.join(uploadsDir, relative);
}

module.exports = { resolveUploadAbsolute };

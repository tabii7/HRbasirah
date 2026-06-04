#!/usr/bin/env node
/**
 * Dev entry: free PORT from stale node processes, then start the API.
 * Avoids the false "listening" message when the port is already taken.
 */
const { spawn } = require("child_process");
const path = require("path");

require("dotenv").config({ quiet: true, path: path.join(__dirname, "..", ".env") });

const PORT = Number(process.env.PORT) || 5001;

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit", shell: false });
    child.on("error", reject);
    child.on("exit", (code) => resolve(code ?? 0));
  });
}

async function freePort() {
  if (process.platform === "win32") return;
  const code = await run("lsof", ["-ti", `:${PORT}`]);
  if (code !== 0) return;
  console.log(`Freeing port ${PORT} (stopping previous server)...`);
  await run("sh", ["-c", `lsof -ti :${PORT} | xargs kill -9 2>/dev/null || true`]);
  await new Promise((r) => setTimeout(r, 400));
}

async function main() {
  await freePort();
  const indexPath = path.join(__dirname, "..", "index.js");
  const child = spawn(process.execPath, [indexPath], {
    stdio: "inherit",
    cwd: path.join(__dirname, ".."),
  });
  child.on("exit", (code) => process.exit(code ?? 0));
  process.on("SIGINT", () => child.kill("SIGINT"));
  process.on("SIGTERM", () => child.kill("SIGTERM"));
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

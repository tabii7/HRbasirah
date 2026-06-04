require("dotenv").config({ quiet: true });

const app = require("./app");
const { PORT } = require("./config/constants");

const HOST = process.env.HOST || "127.0.0.1";
const server = app.listen(PORT, HOST);

server.on("listening", () => {
  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : PORT;
  const base = `http://${HOST}:${port}`;
  console.log(`Server running at ${base}`);
  console.log(`Health check: ${base}/api/health`);
  console.log("Press Ctrl+C to stop.");
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\nPort ${PORT} is already in use on ${HOST}.`);
    console.error("Free the port, then start again:");
    console.error(`  cd server && npm run stop && npm run dev\n`);
  } else {
    console.error("Server failed to start:", err.message);
  }
  process.exit(1);
});

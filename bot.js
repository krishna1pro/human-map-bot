const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn, execSync } = require("child_process");

console.log("🚀 Starting OpenClaw Telegram bot engine...");

// ────────────────────────────────────────────────
// 1. Keep-alive server (Railway prefers 8080 for background services)
// ────────────────────────────────────────────────
const dummy = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Bot alive");
});
dummy.listen(8080, "0.0.0.0", () => {
  console.log("Dummy server listening on port 8080");
});

// ────────────────────────────────────────────────
// 2. Create config directory & minimal safe config
// ────────────────────────────────────────────────
const home = process.env.HOME || "/root";
const configDir = path.join(home, ".openclaw");
const configPath = path.join(configDir, "openclaw.json");

fs.mkdirSync(configDir, { recursive: true });

const config = {
  gateway: {
    mode: "local",
    bind: "lan"
  },
  channels: {
    telegram: {
      enabled: true
    }
  }
};

fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log("Config written to", configPath);

// ────────────────────────────────────────────────
// 3. Clean stale lock / pid file (very common cause of silent exit 1)
// ────────────────────────────────────────────────
const lockPath = path.join(configDir, "gateway.pid");
if (fs.existsSync(lockPath)) {
  console.log("Removing stale gateway lock/pid file:", lockPath);
  try {
    fs.unlinkSync(lockPath);
    console.log("Stale lock removed successfully");
  } catch (err) {
    console.warn("Could not remove lock file:", err.message);
  }
}

// ────────────────────────────────────────────────
// 4. Diagnostic: test if the openclaw binary is runnable at all
// ────────────────────────────────────────────────
console.log("Testing openclaw binary with --version...");
const versionTest = spawn("/usr/local/bin/openclaw", ["--version"]);

versionTest.stdout.on("data", (data) => {
  console.log("openclaw --version output:", data.toString().trim());
});

versionTest.stderr.on("data", (data) => {
  console.error("openclaw --version STDERR:", data.toString().trim());
});

versionTest.on("error", (err) => {
  console.error("Failed to spawn openclaw binary:", err.message);
});

versionTest.on("close", (code, signal) => {
  console.log(`openclaw --version exited with code ${code}, signal ${signal}`);
});

// ────────────────────────────────────────────────
// Optional: Force reinstall openclaw (uncomment only if --version fails)
// ────────────────────────────────────────────────
// try {
//   console.log("Force reinstalling openclaw...");
//   execSync("npm install -g openclaw@latest --force", { stdio: "inherit" });
//   console.log("Reinstall finished");
// } catch (err) {
//   console.error("Reinstall failed:", err.message);
// }

// ────────────────────────────────────────────────
// 5. Launch gateway with bypass flags
// ────────────────────────────────────────────────
const gatewayArgs = ["gateway", "--allow-unconfigured"];

console.log("Launching openclaw gateway with args:", gatewayArgs);

const gw = spawn("/usr/local/bin/openclaw", gatewayArgs);

// ────────────────────────────────────────────────
// Capture ALL output
// ────────────────────────────────────────────────
gw.stdout.on("data", (data) => {
  console.log("Gateway STDOUT:", data.toString().trim());
});

gw.stderr.on("data", (data) => {
  console.error("Gateway STDERR:", data.toString().trim());
});

gw.on("error", (err) => {
  console.error("Gateway spawn failed:", err.message);
  process.exit(1);
});

gw.on("close", (code, signal) => {
  console.log(`Gateway exited with code ${code}, signal ${signal}`);
  // Exit container so Railway restarts it
  process.exit(code || 1);
});

console.log("Gateway spawn command issued — waiting for output...");

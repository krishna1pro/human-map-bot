const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

console.log("🚀 Starting OpenClaw Telegram bot engine...");

// Keep-alive server (Railway likes 8080 better than 7860 for non-HTTP services)
const dummy = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Bot alive");
});
dummy.listen(8080, "0.0.0.0", () => console.log("Dummy server listening on port 8080"));

// Create .openclaw directory and minimal config
const home = process.env.HOME || "/root";
const configDir = path.join(home, ".openclaw");
const configPath = path.join(configDir, "openclaw.json");

fs.mkdirSync(configDir, { recursive: true });

// Minimal config — safe and minimal
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

// Clean stale lock / pid file (very common cause of silent exit code 1)
const lockPath = path.join(configDir, "gateway.pid");
if (fs.existsSync(lockPath)) {
  console.log("Removing stale gateway lock/pid file");
  try {
    fs.unlinkSync(lockPath);
  } catch (err) {
    console.warn("Could not remove lock file:", err.message);
  }
}

// Spawn gateway with --allow-unconfigured to bypass strict checks
const args = ["gateway", "--allow-unconfigured"];

console.log("Spawning openclaw gateway with args:", args);

const gw = spawn("/usr/local/bin/openclaw", args);

// Better logging — capture EVERYTHING
gw.stdout.on("data", (data) => {
  console.log("Gateway STDOUT:", data.toString().trim());
});

gw.stderr.on("data", (data) => {
  console.error("Gateway STDERR:", data.toString().trim());
});

gw.on("error", (err) => {
  console.error("Gateway spawn ERROR:", err.message);
});

gw.on("close", (code, signal) => {
  console.log(`Gateway exited with code ${code}, signal ${signal}`);
  // If it dies, exit container so Railway restarts
  process.exit(code || 1);
});

console.log("Gateway process launched — PID should be visible next");

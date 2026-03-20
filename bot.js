const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

console.log("🚀 Starting OpenClaw Telegram bot engine...");

// Dummy server for platform keep-alive (Railway doesn't strictly need it like HF, but harmless)
const dummy = http.createServer((req, res) => {
  res.writeHead(200, {"Content-Type": "text/plain"});
  res.end("Bot alive");
});
dummy.listen(3000 || 7860, "0.0.0.0", () => console.log("Dummy on port 3000/7860"));

// Minimal config to avoid crashes
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
console.log("Config created at " + configPath);

// Launch gateway
const gw = spawn("/usr/local/bin/openclaw", ["gateway"]);

gw.stdout.on("data", (data) => console.log("Gateway →", data.toString().trim()));
gw.stderr.on("data", (data) => console.error("Gateway ERROR →", data.toString().trim()));

gw.on("close", (code) => {
  console.log("Gateway exited code", code);
  process.exit(code || 1);
});

const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

console.log("=== OpenClaw Telegram Bot - ULTRA MINIMAL ===");
console.log("Time:", new Date().toISOString());

// Dummy on 8080
const dummy = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Alive");
});
dummy.listen(8080, "0.0.0.0", () => console.log("[ALIVE] Port 8080"));

// Config dir + minimal file
const configDir = path.join(process.env.HOME || "/root", ".openclaw");
fs.mkdirSync(configDir, { recursive: true });

const config = {
  gateway: {
    mode: "local",
    bind: "loopback"  // safest, least memory
  },
  channels: {
    telegram: {
      enabled: true
    }
  }
};

fs.writeFileSync(path.join(configDir, "openclaw.json"), JSON.stringify(config));
console.log("[CONFIG] Minimal config done");

// Cleanup minimal
const pidFile = path.join(configDir, "gateway.pid");
if (fs.existsSync(pidFile)) {
  console.log("[CLEANUP] Removing pid file");
  try { fs.unlinkSync(pidFile); } catch (e) {}
}

// Launch
const args = ["gateway", "--allow-unconfigured"];
console.log("[GATEWAY] Launching:", args.join(" "));

const gw = spawn("/usr/local/bin/openclaw", args);

gw.stdout.on("data", d => console.log("[GW-OUT]", d.toString().trim()));
gw.stderr.on("data", d => console.error("[GW-ERR]", d.toString().trim()));
gw.on("close", (c, s) => {
  console.log("[GW-EXIT] code =", c, "signal =", s || "none");
  process.exit(c || 1);
});

console.log("[STARTUP] Waiting...");

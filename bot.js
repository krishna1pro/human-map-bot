const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn, execSync } = require("child_process");

console.log("=== OpenClaw Telegram Bot Engine Startup ===");
console.log("Current time:", new Date().toISOString());
console.log("HOME:", process.env.HOME || "/root");
console.log("TELEGRAM_BOT_TOKEN length:", process.env.TELEGRAM_BOT_TOKEN ? process.env.TELEGRAM_BOT_TOKEN.length : "(not set)");
console.log("EDGE_FUNCTION_URL:", process.env.EDGE_FUNCTION_URL || "(not set)");

// ────────────────────────────────────────────────
// 1. Keep-alive dummy server (Railway friendly port)
// ────────────────────────────────────────────────
const dummy = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Bot is running");
});
dummy.listen(8080, "0.0.0.0", () => {
  console.log("[KEEP-ALIVE] Listening on port 8080");
});

// ────────────────────────────────────────────────
// 2. Directory & minimal config
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
console.log("[CONFIG] Written to:", configPath);

// ────────────────────────────────────────────────
// 3. Clean ALL possible stale files
// ────────────────────────────────────────────────
const staleFiles = [
  path.join(configDir, "gateway.pid"),
  path.join(configDir, "gateway.lock"),
  path.join(configDir, "state.json"),
  path.join(configDir, "telegram.state"),
  path.join(configDir, "openclaw.lock")
];

staleFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log("[CLEANUP] Removing stale file:", file);
    try {
      fs.unlinkSync(file);
      console.log("[CLEANUP] Success:", file);
    } catch (err) {
      console.warn("[CLEANUP] Failed:", file, err.message);
    }
  }
});

// ────────────────────────────────────────────────
// 4. Diagnostic 1: openclaw --version
// ────────────────────────────────────────────────
console.log("[DIAG] Testing openclaw binary --version...");
const ver = spawn("/usr/local/bin/openclaw", ["--version"]);

ver.stdout.on("data", d => console.log("[VERSION-STDOUT]", d.toString().trim()));
ver.stderr.on("data", d => console.error("[VERSION-STDERR]", d.toString().trim()));
ver.on("error", err => console.error("[VERSION-SPAWN-ERROR]", err.message));
ver.on("close", code => console.log("[VERSION-EXIT]", "code =", code));

// ────────────────────────────────────────────────
// 5. Diagnostic 2: openclaw doctor
// ────────────────────────────────────────────────
console.log("[DIAG] Running openclaw doctor...");
const doctor = spawn("/usr/local/bin/openclaw", ["doctor"]);

doctor.stdout.on("data", d => console.log("[DOCTOR-STDOUT]", d.toString().trim()));
doctor.stderr.on("data", d => console.error("[DOCTOR-STDERR]", d.toString().trim()));
doctor.on("error", err => console.error("[DOCTOR-SPAWN-ERROR]", err.message));
doctor.on("close", code => console.log("[DOCTOR-EXIT]", "code =", code));

// ────────────────────────────────────────────────
// Optional: Force reinstall (uncomment if --version or doctor fails)
// ────────────────────────────────────────────────
// console.log("[REINSTALL] Force reinstalling openclaw...");
// try {
//   execSync("npm install -g openclaw@latest --force", { stdio: "inherit" });
//   console.log("[REINSTALL] Done");
// } catch (e) {
//   console.error("[REINSTALL] Failed:", e.message);
// }

// ────────────────────────────────────────────────
// 6. Launch gateway
// ────────────────────────────────────────────────
const gatewayArgs = ["gateway", "--allow-unconfigured"];

console.log("[GATEWAY] Launching with args:", gatewayArgs);

const gw = spawn("/usr/local/bin/openclaw", gatewayArgs);

gw.stdout.on("data", d => console.log("[GATEWAY-STDOUT]", d.toString().trim()));
gw.stderr.on("data", d => console.error("[GATEWAY-STDERR]", d.toString().trim()));
gw.on("error", err => console.error("[GATEWAY-SPAWN-ERROR]", err.message));
gw.on("close", (code, signal) => {
  console.log("[GATEWAY-EXIT]", `code = ${code}, signal = ${signal}`);
  process.exit(code || 1);
});

console.log("[STARTUP] All checks done — waiting for gateway output...");

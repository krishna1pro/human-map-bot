const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

// ── Catch unhandled errors in this process itself ────────────────────────────
process.on("uncaughtException", (err) => {
  console.error("💥 [uncaughtException]", err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("💥 [unhandledRejection]", reason);
  process.exit(1);
});

console.log("🚀 Starting OpenClaw Telegram bot engine...");

// ── Log env vars that affect gateway startup ─────────────────────────────────
console.log("🔑 TELEGRAM_BOT_TOKEN :", process.env.TELEGRAM_BOT_TOKEN ? "SET (length=" + process.env.TELEGRAM_BOT_TOKEN.length + ")" : "NOT SET ⚠️");
console.log("🔑 EDGE_FUNCTION_URL  :", process.env.EDGE_FUNCTION_URL  || "NOT SET ⚠️");
console.log("🔑 HOME               :", process.env.HOME || "(unset)");
console.log("🔑 NODE_ENV           :", process.env.NODE_ENV || "(unset)");

// ── Dummy server for platform keep-alive ─────────────────────────────────────
const PORT = parseInt(process.env.PORT || "3000", 10);
const dummy = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Bot alive");
});
dummy.listen(PORT, "0.0.0.0", () => console.log("🌐 Keep-alive server listening on port " + PORT));

// ── Write minimal OpenClaw config ────────────────────────────────────────────
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
console.log("📄 Config written to " + configPath);
console.log("📄 Config contents:", JSON.stringify(config, null, 2));

// ── Resolve gateway binary ────────────────────────────────────────────────────
const GW_BIN = "/usr/local/bin/openclaw";
console.log("🔍 Gateway binary    :", GW_BIN);
try {
  fs.accessSync(GW_BIN, fs.constants.X_OK);
  console.log("✅ Gateway binary exists and is executable");
} catch (e) {
  console.error("❌ Gateway binary check failed:", e.message);
}

// ── Spawn gateway ─────────────────────────────────────────────────────────────
console.log("⚙️  Spawning gateway process...");
const gw = spawn(GW_BIN, ["gateway"], {
  env: process.env,          // pass full environment through
  stdio: ["ignore", "pipe", "pipe"]
});

console.log("⚙️  Gateway PID:", gw.pid);

// Capture every byte from stdout
gw.stdout.on("data", (data) => {
  data.toString().split("\n").filter(Boolean).forEach((line) => {
    console.log("  [gateway stdout]", line);
  });
});

// Capture every byte from stderr
gw.stderr.on("data", (data) => {
  data.toString().split("\n").filter(Boolean).forEach((line) => {
    console.error("  [gateway stderr]", line);
  });
});

// Catch spawn-level errors (e.g. binary not found, EACCES)
gw.on("error", (err) => {
  console.error("❌ Failed to spawn gateway:", err.message);
  console.error("   code:", err.code, "| path:", err.path);
  process.exit(1);
});

// ── Early-exit watchdog (5 s) ─────────────────────────────────────────────────
let gatewayAlive = true;
const watchdog = setTimeout(() => {
  if (!gatewayAlive) return;
  console.log("✅ Gateway survived the 5-second startup window — looks healthy");
}, 5000);

gw.on("close", (code, signal) => {
  gatewayAlive = false;
  clearTimeout(watchdog);
  console.error("🛑 Gateway process exited — code:", code, "| signal:", signal);
  if (code !== 0) {
    console.error("   Non-zero exit. Check [gateway stderr] lines above for the root cause.");
  }
  process.exit(code != null ? code : 1);
});

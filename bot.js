const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

console.log("=== OpenClaw Telegram Bot Engine - Final with Dummy LLM ===");
console.log("Current time:", new Date().toISOString());
console.log("HOME:", process.env.HOME || "/root");
console.log("TELEGRAM_BOT_TOKEN length:", process.env.TELEGRAM_BOT_TOKEN ? process.env.TELEGRAM_BOT_TOKEN.length : "(not set)");
console.log("EDGE_FUNCTION_URL:", process.env.EDGE_FUNCTION_URL || "(not set)");

// ────────────────────────────────────────────────
// 1. Keep-alive server (port 8080 for Railway)
// ────────────────────────────────────────────────
const dummy = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Bot is running");
});
dummy.listen(8080, "0.0.0.0", () => {
  console.log("[KEEP-ALIVE] Dummy server listening on port 8080");
});

// ────────────────────────────────────────────────
// 2. Create config directory & config with DUMMY LLM
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
  },
  // ────────────────────────────────────────────────
  // DUMMY LLM PROVIDER (required for doctor/gateway startup)
  // Use real GROQ_API_KEY in Railway Variables for actual use
  // ────────────────────────────────────────────────
  providers: {
    groq: {
      enabled: true,
      apiKey: process.env.GROQ_API_KEY || "gsk_dummy_for_startup_only_replace_me"
    }
  }
};

fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log("[CONFIG] Written to:", configPath);

// ────────────────────────────────────────────────
// 3. Clean stale lock/state files
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
    console.log("[CLEANUP] Removing:", file);
    try { fs.unlinkSync(file); } catch (err) { console.warn("[CLEANUP] Failed:", err.message); }
  }
});

// ────────────────────────────────────────────────
// 4. Diagnostics: --version and doctor
// ────────────────────────────────────────────────
console.log("[DIAG] openclaw --version...");
const ver = spawn("/usr/local/bin/openclaw", ["--version"]);
ver.stdout.on("data", d => console.log("[VERSION-STDOUT]", d.toString().trim()));
ver.stderr.on("data", d => console.error("[VERSION-STDERR]", d.toString().trim()));
ver.on("close", code => console.log("[VERSION-EXIT] code =", code));

console.log("[DIAG] openclaw doctor...");
const doctor = spawn("/usr/local/bin/openclaw", ["doctor"]);
doctor.stdout.on("data", d => console.log("[DOCTOR-STDOUT]", d.toString().trim()));
doctor.stderr.on("data", d => console.error("[DOCTOR-STDERR]", d.toString().trim()));
doctor.on("close", code => console.log("[DOCTOR-EXIT] code =", code));

// ────────────────────────────────────────────────
// 5. Launch gateway
// ────────────────────────────────────────────────
const args = ["gateway", "--allow-unconfigured"];
console.log("[GATEWAY] Launching:", args);

const gw = spawn("/usr/local/bin/openclaw", args);

gw.stdout.on("data", d => console.log("[GATEWAY-STDOUT]", d.toString().trim()));
gw.stderr.on("data", d => console.error("[GATEWAY-STDERR]", d.toString().trim()));
gw.on("close", (code, signal) => {
  console.log("[GATEWAY-EXIT] code =", code, "signal =", signal || "none");
  process.exit(code || 1);
});

console.log("[STARTUP] Waiting for gateway...");

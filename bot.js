const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

console.log("=== OpenClaw Telegram Bot - FINAL WORKING VERSION ===");
console.log("Time:", new Date().toISOString());
console.log("TELEGRAM_BOT_TOKEN:", process.env.TELEGRAM_BOT_TOKEN ? "SET (len " + process.env.TELEGRAM_BOT_TOKEN.length + ")" : "MISSING");
console.log("EDGE_FUNCTION_URL:", process.env.EDGE_FUNCTION_URL || "MISSING");
console.log("GROQ_API_KEY:", process.env.GROQ_API_KEY ? "SET" : "MISSING");

// 1. Dummy server on 8080 (Railway requirement)
const dummy = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Bot running");
});
dummy.listen(8080, "0.0.0.0", () => console.log("[KEEP-ALIVE] Listening on 8080"));

// 2. Config directory
const configDir = path.join(process.env.HOME || "/root", ".openclaw");
const configPath = path.join(configDir, "openclaw.json");
fs.mkdirSync(configDir, { recursive: true });

// Minimal config - NO "providers" key
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
console.log("[CONFIG] Written to", configPath);

// 3. Aggressive cleanup of stale files
const staleFiles = [
  path.join(configDir, "gateway.pid"),
  path.join(configDir, "gateway.lock"),
  path.join(configDir, "state.json"),
  path.join(configDir, "telegram.state"),
  path.join(configDir, "openclaw.lock"),
  path.join(configDir, "credentials.json")
];

staleFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log("[CLEANUP] Deleting", file);
    try { fs.unlinkSync(file); } catch (e) { console.warn(e.message); }
  }
});

// 4. Diagnostics
console.log("[DIAG] --version...");
const ver = spawn("/usr/local/bin/openclaw", ["--version"]);
ver.stdout.on("data", d => console.log("[VER-STDOUT]", d.toString().trim()));
ver.stderr.on("data", d => console.error("[VER-STDERR]", d.toString().trim()));
ver.on("close", c => console.log("[VER-EXIT] code =", c));

console.log("[DIAG] doctor...");
const doc = spawn("/usr/local/bin/openclaw", ["doctor"]);
doc.stdout.on("data", d => console.log("[DOC-STDOUT]", d.toString().trim()));
doc.stderr.on("data", d => console.error("[DOC-STDERR]", d.toString().trim()));
doc.on("close", c => console.log("[DOC-EXIT] code =", c));

// 5. Launch gateway
const args = ["gateway", "--allow-unconfigured"];
console.log("[GATEWAY] Launching:", args.join(" "));

const gw = spawn("/usr/local/bin/openclaw", args);

gw.stdout.on("data", d => console.log("[GW-STDOUT]", d.toString().trim()));
gw.stderr.on("data", d => console.error("[GW-STDERR]", d.toString().trim()));
gw.on("close", (c, s) => {
  console.log("[GW-EXIT] code =", c, "signal =", s || "none");
  process.exit(c || 1);
});

console.log("[STARTUP] Waiting for gateway...");

const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

console.log("=== OpenClaw Telegram Bot - FINAL DIRECTORY FIX VERSION ===");
console.log("Time:", new Date().toISOString());
console.log("TELEGRAM_BOT_TOKEN len:", process.env.TELEGRAM_BOT_TOKEN?.length || "MISSING");
console.log("EDGE_FUNCTION_URL:", process.env.EDGE_FUNCTION_URL || "MISSING");
console.log("GROQ_API_KEY:", process.env.GROQ_API_KEY ? "SET" : "MISSING");

// 1. Keep-alive on 8080
const dummy = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Bot running");
});
dummy.listen(8080, "0.0.0.0", () => console.log("[KEEP-ALIVE] Port 8080"));

// 2. Config directory + required OpenClaw subdirs
const configDir = path.join(process.env.HOME || "/root", ".openclaw");
const requiredDirs = [
  configDir,
  path.join(configDir, "agents"),
  path.join(configDir, "agents/main"),
  path.join(configDir, "agents/main/sessions"),
  path.join(configDir, "canvas"),
  path.join(configDir, "credentials"),
  "/tmp/openclaw"
];

requiredDirs.forEach(dir => {
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, ".test"), "writable"); // test write
    fs.unlinkSync(path.join(dir, ".test")); // cleanup test
    console.log("[DIR] Created & writable:", dir);
  } catch (err) {
    console.error("[DIR-ERROR]", dir, err.message);
  }
});

// 3. Minimal config (no extra keys)
const configPath = path.join(configDir, "openclaw.json");
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
console.log("[CONFIG] Written:", configPath);

// 4. Cleanup stale files
const staleFiles = [
  path.join(configDir, "gateway.pid"),
  path.join(configDir, "gateway.lock"),
  path.join(configDir, "state.json")
];

staleFiles.forEach(f => {
  if (fs.existsSync(f)) {
    console.log("[CLEANUP] Deleting", f);
    try { fs.unlinkSync(f); } catch (e) {}
  }
});

// 5. Launch gateway
const args = ["gateway", "--allow-unconfigured"];
console.log("[GATEWAY] Starting:", args.join(" "));

const gw = spawn("/usr/local/bin/openclaw", args);

gw.stdout.on("data", d => console.log("[GW-STDOUT]", d.toString().trim()));
gw.stderr.on("data", d => console.error("[GW-STDERR]", d.toString().trim()));
gw.on("close", (code, signal) => {
  console.log("[GW-EXIT] code =", code, "signal =", signal || "none");
  process.exit(code || 1);
});

console.log("[STARTUP] Waiting for gateway...");

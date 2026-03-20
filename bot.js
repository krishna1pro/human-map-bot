const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

console.log("=== OpenClaw Telegram Bot - Final Fixed Version ===");
console.log("Time:", new Date().toISOString());
console.log("TELEGRAM_BOT_TOKEN length:", process.env.TELEGRAM_BOT_TOKEN?.length || "(missing)");
console.log("EDGE_FUNCTION_URL:", process.env.EDGE_FUNCTION_URL || "(missing)");

// 1. Dummy keep-alive (Railway requires a listening port)
const dummy = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Bot alive");
});
dummy.listen(8080, "0.0.0.0", () => console.log("[KEEP-ALIVE] Port 8080"));

// 2. Config - MINIMAL & VALID (NO "providers" key!)
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
console.log("[CONFIG] Written:", configPath);

// 3. Clean stale files
const stale = [
  path.join(configDir, "gateway.pid"),
  path.join(configDir, "gateway.lock"),
  path.join(configDir, "state.json"),
  path.join(configDir, "telegram.state")
];
stale.forEach(f => {
  if (fs.existsSync(f)) {
    console.log("[CLEANUP] Removing:", f);
    try { fs.unlinkSync(f); } catch(e) { console.warn(e.message); }
  }
});

// 4. Diagnostics (for logs)
console.log("[DIAG] --version...");
const ver = spawn("/usr/local/bin/openclaw", ["--version"]);
ver.stdout.on("data", d => console.log("[VER-STDOUT]", d.toString().trim()));
ver.on("close", c => console.log("[VER-EXIT] code =", c));

console.log("[DIAG] doctor...");
const doc = spawn("/usr/local/bin/openclaw", ["doctor"]);
doc.stdout.on("data", d => console.log("[DOC-STDOUT]", d.toString().trim()));
doc.stderr.on("data", d => console.error("[DOC-STDERR]", d.toString().trim()));
doc.on("close", c => console.log("[DOC-EXIT] code =", c));

// 5. Launch gateway
const args = ["gateway", "--allow-unconfigured"];
console.log("[GATEWAY] Starting:", args.join(" "));

const gw = spawn("/usr/local/bin/openclaw", args);

gw.stdout.on("data", d => console.log("[GATEWAY-STDOUT]", d.toString().trim()));
gw.stderr.on("data", d => console.error("[GATEWAY-STDERR]", d.toString().trim()));
gw.on("close", (c, s) => {
  console.log("[GATEWAY-EXIT] code =", c, "signal =", s || "none");
  process.exit(c || 1);
});

console.log("[STARTUP] Waiting...");

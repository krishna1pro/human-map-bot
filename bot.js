const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

console.log("=== OpenClaw Telegram Bot - WORKING VERSION ===");
console.log("Time:", new Date().toISOString());
console.log("TELEGRAM_BOT_TOKEN:", process.env.TELEGRAM_BOT_TOKEN ? "SET (len " + process.env.TELEGRAM_BOT_TOKEN.length + ")" : "MISSING");
console.log("EDGE_FUNCTION_URL:", process.env.EDGE_FUNCTION_URL || "MISSING");
console.log("GROQ_API_KEY:", process.env.GROQ_API_KEY ? "SET" : "MISSING");

// 1. Dummy keep-alive on 8080
const dummy = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Bot running");
});
dummy.listen(8080, "0.0.0.0", () => console.log("[KEEP-ALIVE] Port 8080"));

// 2. Minimal valid config
const configDir = path.join(process.env.HOME || "/root", ".openclaw");
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

fs.writeFileSync(path.join(configDir, "openclaw.json"), JSON.stringify(config, null, 2));
console.log("[CONFIG] Written");

// 3. Cleanup stale files
const stale = [
  path.join(configDir, "gateway.pid"),
  path.join(configDir, "gateway.lock")
];
stale.forEach(f => {
  if (fs.existsSync(f)) {
    console.log("[CLEANUP] Deleting", f);
    try { fs.unlinkSync(f); } catch (e) {}
  }
});

// 4. Launch gateway
const args = ["gateway", "--allow-unconfigured"];
console.log("[GATEWAY] Starting:", args.join(" "));

const gw = spawn("/usr/local/bin/openclaw", args);

gw.stdout.on("data", d => console.log("[GW-STDOUT]", d.toString().trim()));
gw.stderr.on("data", d => console.error("[GW-STDERR]", d.toString().trim()));
gw.on("close", (c, s) => {
  console.log("[GW-EXIT] code =", c, "signal =", s || "none");
  process.exit(c || 1);
});

console.log("[STARTUP] Waiting for gateway...");

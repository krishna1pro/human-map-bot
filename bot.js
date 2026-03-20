const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

console.log("=== OpenClaw Bot - LAST RAILWAY TRY ===");
console.log("Time:", new Date().toISOString());

// Dummy on 8080
const dummy = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Alive");
});
dummy.listen(8080, "0.0.0.0", () => console.log("Dummy on 8080"));

// Config
const configDir = path.join(process.env.HOME || "/root", ".openclaw");
fs.mkdirSync(configDir, { recursive: true });

const config = {
  gateway: {
    mode: "local",
    bind: "loopback"
  },
  channels: {
    telegram: {
      enabled: true
    }
  }
};

fs.writeFileSync(path.join(configDir, "openclaw.json"), JSON.stringify(config));
console.log("Config written");

// Cleanup
const pid = path.join(configDir, "gateway.pid");
if (fs.existsSync(pid)) {
  console.log("Cleaning pid");
  try { fs.unlinkSync(pid); } catch (e) {}
}

// Launch
console.log("Starting gateway...");
const gw = spawn("/usr/local/bin/openclaw", ["gateway", "--allow-unconfigured"]);

gw.stdout.on("data", d => console.log("GW OUT:", d.toString().trim()));
gw.stderr.on("data", d => console.error("GW ERR:", d.toString().trim()));
gw.on("close", (c, s) => {
  console.log("GW EXIT: code =", c, "signal =", s || "none");
  process.exit(c || 1);
});

console.log("Spawn issued...");

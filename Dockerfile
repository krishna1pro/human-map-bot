FROM node:22-slim

# Install git + clean
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Latest OpenClaw
RUN npm install -g openclaw@latest --no-fund --no-audit

# Dummy server tool
RUN npm install -g http-server

COPY SKILL.md .

# Startup script — super minimal config to avoid validation crash
RUN echo '#!/usr/bin/env node\n\
const http = require("http");\n\
const fs = require("fs");\n\
const path = require("path");\n\
const { spawn } = require("child_process");\n\
\n\
console.log("🚀 Starting OpenClaw Telegram bot engine...");\n\
\n\
// HF dummy on 7860\n\
const dummy = http.createServer((req, res) => {\n\
  res.writeHead(200, {"Content-Type": "text/plain"});\n\
  res.end("OpenClaw gateway alive");\n\
});\n\
dummy.listen(7860, "0.0.0.0", () => console.log("Dummy server on 7860"));\n\
\n\
// Bare-minimum config: only gateway.mode=local + enable telegram\n\
const home = process.env.HOME || "/root";\n\
const configDir = path.join(home, ".openclaw");\n\
const configPath = path.join(configDir, "openclaw.json");\n\
\n\
fs.mkdirSync(configDir, { recursive: true });\n\
\n\
const config = {\n\
  gateway: {\n\
    mode: "local",\n\
    bind: "lan"\n\
  },\n\
  channels: {\n\
    telegram: {\n\
      enabled: true\n\
      // NO dmPolicy or allowFrom — let defaults apply (usually "pairing")\n\
    }\n\
  }\n\
};\n\
\n\
fs.writeFileSync(configPath, JSON.stringify(config, null, 2));\n\
console.log("Minimal config created at " + configPath);\n\
\n\
// Spawn gateway\n\
const gw = spawn("/usr/local/bin/openclaw", ["gateway"]);\n\
\n\
gw.stdout.on("data", (data) => console.log("Gateway →", data.toString().trim()));\n\
gw.stderr.on("data", (data) => console.error("Gateway ERROR →", data.toString().trim()));\n\
\n\
gw.on("close", (code) => {\n\
  console.log("Gateway exited code", code);\n\
  process.exit(code || 1);\n\
});\n\
' > start-bot.js && chmod +x start-bot.js

EXPOSE 7860

CMD ["node", "start-bot.js"]

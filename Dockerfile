FROM node:22-slim

# Install git + clean
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Latest OpenClaw
RUN npm install -g openclaw@latest --no-fund --no-audit

# Dummy server tool
RUN npm install -g http-server

COPY SKILL.md .
COPY bot.js .

EXPOSE 3000

CMD ["node", "bot.js"]

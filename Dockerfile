FROM node:22

# Add libraries OpenClaw gateway likely needs (libstdc++, openssl, zlib, etc.)
RUN apt-get update && apt-get install -y \
    git \
    ca-certificates \
    libstdc++6 \
    libssl3 \
    zlib1g \
    libgomp1 \
    libatomic1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN npm install -g openclaw@latest --no-fund --no-audit

COPY SKILL.md .
COPY bot.js .

EXPOSE 8080

CMD ["node", "bot.js"]

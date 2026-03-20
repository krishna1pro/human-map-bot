FROM node:22

RUN apt-get update && apt-get install -y \
    git \
    ca-certificates \
    libstdc++6 \
    libssl3 \
    zlib1g \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN npm install -g openclaw@latest --no-fund --no-audit

COPY SKILL.md .
COPY bot.js .

EXPOSE 8080

CMD ["node", "bot.js"]

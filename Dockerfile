FROM node:22

# Install git + common runtime deps that openclaw might need
RUN apt-get update && apt-get install -g git ca-certificates libssl3 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install latest openclaw
RUN npm install -g openclaw@latest --no-fund --no-audit

# Copy skill and startup
COPY SKILL.md .
COPY bot.js .

EXPOSE 8080

CMD ["node", "bot.js"]

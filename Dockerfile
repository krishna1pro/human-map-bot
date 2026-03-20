FROM node:22-slim

# Install git (sometimes needed) + clean up
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install latest openclaw globally
RUN npm install -g openclaw@latest --no-fund --no-audit

# Copy your skill and startup script
COPY SKILL.md .
COPY bot.js .

# Expose port (Railway prefers 8080 for background services)
EXPOSE 8080

# Start the bot
CMD ["node", "bot.js"]

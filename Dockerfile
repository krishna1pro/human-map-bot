FROM node:22

# Install git + some common runtime libraries that might be needed
# -y = auto confirm prompts, no interactive input in Docker
RUN apt-get update && \
    apt-get install -y git ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install latest openclaw globally
RUN npm install -g openclaw@latest --no-fund --no-audit

# Copy your files
COPY SKILL.md .
COPY bot.js .

# Railway often uses port 8080 for services
EXPOSE 8080

# Start the script
CMD ["node", "bot.js"]

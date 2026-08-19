FROM node:22-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production --no-audit --no-fund

# Copy application source
COPY . .

# Environment Defaults
ENV NODE_ENV=production
ENV PORT=8090
ENV HOST=0.0.0.0
ENV DATA_DIR=/app/minibase_data

# Persistent Data Volume
VOLUME ["/app/minibase_data"]

# Expose Port
EXPOSE 8090

# Start Command
CMD ["node", "bin/minibase.js", "serve"]

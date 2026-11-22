FROM node:20-slim

# Install Python 3 for the isolated coding sandbox
RUN apt-get update && apt-get install -y python3 && \
    ln -sf /usr/bin/python3 /usr/bin/python && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

EXPOSE 5000
CMD ["node", "server.js"]
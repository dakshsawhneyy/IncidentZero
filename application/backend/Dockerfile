FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Stage 2
FROM node:20-alpine     

WORKDIR /app

# Copy only node_modules, server.js and app
# COPY --from=builder /app/node_modules/ ./node_modules
# COPY --from=builder /app/package*.json ./
COPY --from=builder . .

EXPOSE 8080

CMD ["node", "src/server.js"]
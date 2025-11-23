FROM node:20-alpine AS base
WORKDIR /app

COPY package*.json ./
# Install all deps (including dev) because we run Vite dev server in the container
RUN npm ci

COPY vite.config.js index.html ./
COPY src ./src
COPY public ./public

ENV HOST=0.0.0.0
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "--port", "5173"]

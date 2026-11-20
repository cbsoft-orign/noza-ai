FROM node:20-bookworm-slim

ENV PORT=3001

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3001
CMD ["npm", "start"]

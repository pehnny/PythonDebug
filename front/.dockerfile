FROM node:24-slim AS builder

WORKDIR /app

COPY . .

RUN npm install

EXPOSE 5173

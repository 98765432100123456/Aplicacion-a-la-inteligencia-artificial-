# Imagen de la API: se ejecuta en el servidor junto a MariaDB (ver docs/DESPLIEGUE.md).
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
USER node
EXPOSE 8080
ENV PORT=8080
CMD ["node", "dist/main"]

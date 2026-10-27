# Imagen del frontend: nginx sirve la aplicación y reenvía /api al servicio de aplicación
# (ver docs/DESPLIEGUE.md).
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx ng build --configuration production

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
EXPOSE 8080

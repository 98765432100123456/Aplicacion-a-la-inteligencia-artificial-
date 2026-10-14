# Imagen opcional del frontend (nginx). En Google Cloud se recomienda Firebase Hosting;
# esta imagen sirve para docker compose y para desplegar en Cloud Run si se prefiere.
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

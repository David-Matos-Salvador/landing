# Etapa 1: construir el sitio con Vite (Node solo existe aquí, no en la imagen final).
FROM node:24-alpine AS build
WORKDIR /app
# Primero solo las dependencias: Docker reutiliza esta capa mientras package*.json no cambie.
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Etapa 2: nginx sirviendo el resultado. Coolify lo publica con HTTPS en davidmatos.lat y www.
FROM nginx:1.29-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/ /usr/share/nginx/html/

EXPOSE 80

# Coolify usa este healthcheck para saber que nginx ya responde antes de mandarle tráfico.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1

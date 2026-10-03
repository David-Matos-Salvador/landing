# Sitio estático servido por nginx. Coolify lo publica con HTTPS en davidmatos.lat y www.
FROM nginx:1.29-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html styles.css main.js /usr/share/nginx/html/

EXPOSE 80

# Coolify usa este healthcheck para saber que nginx ya responde antes de mandarle tráfico.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1

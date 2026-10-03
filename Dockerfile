# Sitio estático servido por nginx. Coolify lo publica con HTTPS en davidmatos.lat y www.
FROM nginx:1.29-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html styles.css main.js /usr/share/nginx/html/

EXPOSE 80

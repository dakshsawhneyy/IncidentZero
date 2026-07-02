FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2 - Serving with Nginx
FROM nginx:alpine

WORKDIR /app

# removing default nginx static assets -- we don't want them to interfare with our upcomign deployment
RUN rm -rf /usr/share/nginx/html/*

# copying dist and sending it to nginx folder, so nginx can host our frontend
COPY --from=builder /app/dist/ /usr/share/nginx/html

# Custom NGINX config
RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \     
    } \
    
    # if request starts with /api, then process that request to backend
    location /api/ {\
        proxy_pass http://backend:8080; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_cache_bypass $http_upgrade; \
    } \

}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
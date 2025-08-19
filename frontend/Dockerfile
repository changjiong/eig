# frontend/Dockerfile
# --- Build Stage ---
    FROM node:18-alpine AS build
    WORKDIR /app
    COPY package*.json ./
    RUN npm install
    COPY . .
    # 关键：在这里传入后端的API地址
    ARG VITE_API_URL
    ENV VITE_API_URL=${VITE_API_URL}
    RUN npm run build
    
    # --- Production Stage ---
    FROM nginx:stable-alpine
    COPY --from=build /app/dist /usr/share/nginx/html
    # 如果使用React Router等，需要配置Nginx重定向
    COPY nginx.conf /etc/nginx/conf.d/default.conf
    EXPOSE 80
    CMD ["nginx", "-g", "daemon off;"]
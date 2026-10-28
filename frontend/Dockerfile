# Stage 1: Build Vite React App
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./

# Forzar instalación de devDependencies (Vite, Tailwind, etc.) sin importar si se pasó NODE_ENV=production en el build
ENV NODE_ENV=development
RUN npm ci --include=dev

COPY . ./

ARG VITE_API_URL
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

RUN npm run build

# Stage 2: Serve with Nginx Alpine
FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

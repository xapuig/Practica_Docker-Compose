# Etapa 1: Build
FROM node:19-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: Producción
FROM node:19-alpine
WORKDIR /app
COPY --from=build /app/ ./
COPY package*.json ./
RUN npm install 
CMD ["npm", "start"]
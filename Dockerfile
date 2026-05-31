FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
RUN addgroup -S shardlink && adduser -S shardlink -G shardlink
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
RUN chown -R shardlink:shardlink /app
USER shardlink
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "dist/server.js"]

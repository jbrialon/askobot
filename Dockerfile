# ---- Stage 1: Build frontend ----
FROM node:24-alpine AS frontend-build
WORKDIR /app
COPY front/package.json front/package-lock.json ./front/
RUN cd front && npm ci
COPY front/ ./front/
ARG TWITCH_CLIENT_ID
ARG APP_URL
RUN echo "TWITCH_CLIENT_ID=$TWITCH_CLIENT_ID" > .env && \
    echo "APP_URL=$APP_URL" >> .env
RUN cd front && npm run build

# ---- Stage 2: Production image ----
FROM node:24-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY app.js config.js tsconfig.json ./
COPY app/ ./app/
COPY cron/ ./cron/
COPY db/ ./db/
COPY --from=frontend-build /app/front/dist ./front/dist

EXPOSE 3000

CMD ["node", "app.js"]

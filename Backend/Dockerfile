FROM node:20-alpine

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

RUN mkdir -p /app/.wwebjs_auth && chown -R node:node /app/.wwebjs_auth

COPY package.json package-lock.json ./
RUN npm install --omit=dev

COPY . .

USER node

EXPOSE 5000

CMD ["node", "index.js"]

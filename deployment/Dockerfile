FROM node:22-alpine

WORKDIR /app


COPY package*.json ./
COPY prisma ./prisma/

RUN npm i

# Install necessary packages for Puppeteer in runtime image
RUN apk add --no-cache \
    udev \
    ttf-freefont \
    chromium

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY . .

RUN npm run tailwind:build
RUN npm run build

USER node

# Start the node process
CMD ["npm", "run", "start:migrate:prod"]

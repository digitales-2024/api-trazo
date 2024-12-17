FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV PUPPETEER_CHROME_SKIP_DOWNLOAD=true
RUN corepack enable
RUN pnpm config set store-dir /pnpm/.pnpm-store
# error en prisma con alpine
# https://github.com/prisma/prisma/issues/25817#issuecomment-2530137579
RUN ln -s /usr/lib/libssl.so.3 /lib/libssl.so.3

# Chrome for puppeteer
# Installs latest Chromium package.
RUN apk upgrade --no-cache --available \
    && apk add --no-cache \
      chromium-swiftshader \
      ttf-freefont \
      font-noto-emoji \
    && apk add --no-cache \
      --repository=https://dl-cdn.alpinelinux.org/alpine/edge/community \
      font-wqy-zenhei


FROM base AS prod

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN pnpm config set store-dir /pnpm/.pnpm-store

WORKDIR /app
COPY pnpm-lock.yaml .
COPY package.json .
COPY prisma/ .

ENV PUPPETEER_CHROME_SKIP_DOWNLOAD=true
RUN pnpx prisma generate
RUN pnpm i --ignore-scripts

# Build binary
COPY . .
RUN npm run tailwind:build
RUN pnpm run build


FROM base

COPY --from=prod /pnpm /pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN pnpm config set store-dir /pnpm/.pnpm-store

WORKDIR /app

COPY --from=prod /app/dist ./dist
COPY --from=prod /app/prisma ./prisma
COPY --from=prod /app/static ./static
COPY --from=prod /app/package.json .
COPY --from=prod /app/pnpm-lock.yaml .

ENV CHROME_BIN="/usr/bin/chromium-browser"
ENV PUPPETEER_CHROME_SKIP_DOWNLOAD=true
# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV CHROME_PATH=/usr/lib/chromium/

RUN pnpm i --prod
USER node
RUN pnpx 

CMD ["pnpm", "run", "start:migrate:prod"]

FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV HUSKY_SKIP_INSTALL=1
RUN corepack enable
RUN pnpm config set store-dir /pnpm/.pnpm-store


FROM base AS prod

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN pnpm config set store-dir /pnpm/.pnpm-store

WORKDIR /app
COPY pnpm-lock.yaml .
COPY package.json .
COPY prisma/ .

ENV HUSKY_SKIP_INSTALL=1
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
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

COPY --from=prod /app/dist .
COPY --from=prod /app/prisma .
COPY --from=prod /app/static .
COPY --from=prod /app/package.json .
COPY --from=prod /app/pnpm-lock.yaml .

RUN PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true HUSKY_SKIP_INSTALL=1 pnpm i --prod
USER node
CMD ["pnpm", "run", "start:migrate:prod"]

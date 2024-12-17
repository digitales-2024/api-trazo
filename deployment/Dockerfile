FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV HUSKY=0
RUN corepack enable
RUN pnpm config set store-dir /pnpm/.pnpm-store
# error en prisma con alpine
# https://github.com/prisma/prisma/issues/25817#issuecomment-2530137579
RUN ln -s /usr/lib/libssl.so.3 /lib/libssl.so.3


FROM base AS prod

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN pnpm config set store-dir /pnpm/.pnpm-store

WORKDIR /app
COPY pnpm-lock.yaml .
COPY package.json .
COPY prisma/ .

ENV HUSKY=0
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

RUN PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true HUSKY=0 pnpm i --prod
USER node
CMD ["pnpm", "run", "start:migrate:prod"]

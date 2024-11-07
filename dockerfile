FROM node:22-alpine3.20 AS base

ENV DIR /app
WORKDIR $DIR

FROM base AS dev

ENV NODE_ENV=development

COPY package*.json .

RUN npm ci 

COPY tsconfig*.json .
COPY nest-cli.json .
COPY src src

EXPOSE $PORT
CMD ["npm", "run", "dev"]

FROM base AS build

RUN apk update && apk add --no-cache dumb-init=1.2.5-r3

COPY package*.json .
RUN npm ci 
COPY tsconfig*.json .
COPY nest-cli.json .
COPY prisma/schema.prisma prisma/schema.prisma
COPY src src
COPY libs libs

RUN npx prisma generate --schema=./prisma/schema.prisma

RUN npm run build && \
    npm prune --production

FROM base AS production

ENV NODE_ENV=production
ENV USER=node

COPY --from=build /usr/bin/dumb-init /usr/bin/dumb-init
COPY --from=build $DIR/package*.json .
COPY --from=build $DIR/node_modules node_modules
COPY --from=build $DIR/dist dist

USER $USER
EXPOSE $PORT
CMD ["dumb-init", "node", "dist/main.js"]
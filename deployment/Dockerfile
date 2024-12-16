FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm i

COPY . .

RUN npm run tailwind:build
RUN npm run build

USER node

RUN npx puppeteer browsers install chrome

# Start the node process
CMD ["npm", "run", "start:migrate:prod"]

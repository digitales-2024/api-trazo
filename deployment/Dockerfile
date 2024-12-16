FROM node:22

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends libnss3 libnss3-dev libgdk-pixbuf2.0-dev libgtk-3-dev libxss-dev libasound2

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

FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm i

COPY . .

RUN npm run tailwind:build
RUN npm run build


# Start the node process
CMD ["npm", "run", "start:migrate:prod"]

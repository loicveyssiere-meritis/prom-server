FROM node:14.15.1-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --no-fund && npm cache clean --force

COPY . .

CMD [ "node" , "src/server.js" ]


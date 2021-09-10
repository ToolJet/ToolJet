FROM node:14.17.3-buster

ENV NODE_ENV=production

# Fix for JS heap limit allocation issue
ENV NODE_OPTIONS="--max-old-space-size=2048"

RUN apt update && apt install -y \
  build-essential  \
  postgresql \
  freetds-dev

RUN npm install -g @nestjs/cli

RUN mkdir -p /app
WORKDIR /app

# Building ToolJet server
COPY ./server/package.json ./server/package-lock.json ./
RUN npm install --only=production
COPY ./server/ ./
RUN npm run build

ENTRYPOINT ["./entrypoint.sh"]

FROM node:14.17.3-alpine AS FRONTEND_BUILD
ENV NODE_ENV=production

# --no-cache: download package index on-the-fly, no need to cleanup afterwards
# --virtual: bundle packages, remove whole bundle at once, when done
RUN apk --no-cache --virtual build-dependencies add \
    python \
    make \
    g++ 
    
RUN npm i -g npm@7.20.0

WORKDIR /app

COPY ./frontend/package.json ./frontend/package-lock.json  ./
RUN npm install --only=production
COPY ./frontend .
RUN NODE_ENV=production npm run-script build

FROM node:14.17.3-buster AS SERVER_BUILD

RUN npm install -g @nestjs/cli npm@7.20.0

WORKDIR /app

COPY ./server/package.json ./server/package-lock.json ./
RUN npm install --only=production
COPY ./server/ ./
RUN npm run build

FROM node:14.17.3-buster AS DATABASE_BUILD

RUN npm install -g @nestjs/cli npm@7.20.0

WORKDIR /app

COPY ./server/package.json ./server/package-lock.json ./
RUN npm install --only=production
RUN npm install pino-pretty
COPY ./server/ ./
COPY ./.env /.env
COPY ./.env.test /.env.test
RUN npm run db:create
RUN npm run db:migrate
RUN npm run db:seed

FROM node:14.17.3-alpine AS run

COPY --from=DATABASE_BUILD /app/package.json ./db/package.json

COPY --from=FRONTEND_BUILD /app/build ./frontend/build
COPY --from=FRONTEND_BUILD /app/node_modules ./frontend/node_modules
COPY --from=FRONTEND_BUILD /app/build ./frontend/public

COPY ./.env /.env
COPY ./.env.test /.env.test
COPY --from=SERVER_BUILD /app/.version ./server/.version
COPY --from=SERVER_BUILD /app/dist ./server/dist
COPY --from=SERVER_BUILD /app/templates ./server/templates
COPY --from=SERVER_BUILD /app/scripts ./server/scripts
COPY --from=SERVER_BUILD /app/package.json ./server/package.json
COPY --from=SERVER_BUILD /app/node_modules ./server/node_modules
COPY --from=SERVER_BUILD /app/entrypoint.sh ./server/entrypoint.sh

ENTRYPOINT ["./server/entrypoint.sh"]
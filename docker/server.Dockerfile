FROM node:14.17.3-alpine as builder

# Fix for JS heap limit allocation issue
ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN npm i -g npm@7.20.0
RUN npm install -g @nestjs/cli

RUN mkdir -p /app
WORKDIR /app

COPY ./package.json ./package.json

# Building ToolJet plugins
COPY ./plugins/package.json ./plugins/package-lock.json ./plugins/
RUN npm --prefix plugins install
COPY ./plugins/ ./plugins/
RUN npm run build:plugins

ENV NODE_ENV=production
# Building ToolJet server
COPY ./server/package.json ./server/package-lock.json ./server/
RUN npm --prefix server install --only=production
COPY ./server/ ./server/
RUN npm --prefix server run build

FROM node:14.17.3-alpine

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN apk add postgresql-client freetds

# Install Instantclient Basic Light Oracle and Dependencies
RUN apk --no-cache add libaio libnsl libc6-compat curl && \
    cd /tmp && \
    curl -o instantclient-basiclite.zip https://download.oracle.com/otn_software/linux/instantclient/instantclient-basiclite-linuxx64.zip -SL && \
    unzip instantclient-basiclite.zip && \
    mv instantclient*/ /usr/lib/instantclient && \
    rm instantclient-basiclite.zip && \
    ln -s /usr/lib/instantclient/libclntsh.so.19.1 /usr/lib/libclntsh.so && \
    ln -s /usr/lib/instantclient/libocci.so.19.1 /usr/lib/libocci.so && \
    ln -s /lib/libc.so.6 /usr/lib/libresolv.so.2 && \
    ln -s /lib64/ld-linux-x86-64.so.2 /usr/lib/ld-linux-x86-64.so.2

ENV LD_LIBRARY_PATH /usr/lib/instantclient

RUN mkdir -p /app

# copy npm scripts
COPY --from=builder /app/package.json ./app/package.json

# copy plugins dependencies
COPY --from=builder /app/plugins/dist ./app/plugins/dist
COPY --from=builder /app/plugins/client.js ./app/plugins/client.js
COPY --from=builder /app/plugins/node_modules ./app/plugins/node_modules
COPY --from=builder /app/plugins/packages/common ./app/plugins/packages/common
COPY --from=builder /app/plugins/package.json ./app/plugins/package.json
# copy server build
# NOTE: typescript dependency on /server/scripts and typeorm for db creation and migration.
# Need to check if we can optimize such that only executable dist from prev stage can be copied
COPY --from=builder /app/server ./app/server

WORKDIR /app

ENTRYPOINT ["./server/entrypoint.sh"]
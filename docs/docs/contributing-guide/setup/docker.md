---
sidebar_position: 1
---

# Docker
Docker compose is the easiest way to setup ToolJet server and client locally.

## Prerequisites

Make sure you have the latest version of `docker` and `docker-compose` installed.

[Official docker installation guide](https://docs.docker.com/desktop/)
<br>
[Official docker-compose installation guide](https://docs.docker.com/compose/install/)

We recommend:
```bash
docker --version
Docker version 19.03.12, build 48a66213fe
  
docker-compose --version
docker-compose version 1.26.2, build eefe0d31
```

## Setting up

1. Close the repository
   ```bash
    git clone https://github.com/tooljet/tooljet.git
   ```

2. Create a `.env` file by copying `.env.example`. More information on the variables that can be set is given here: env variable reference
   ```bash
    cp .env.example .env
    cp .env.example .env.test
   ```

3. Populate the keys in the `.env` and `.env.test` file.
   :::info
   `SECRET_KEY_BASE` requires a 64 byte key. (If you have `openssl` installed, run `openssl rand -hex 64` to create a 64 byte secure   random key)

   `LOCKBOX_MASTER_KEY` requires a 32 byte key. (Run `openssl rand -hex 32` to create a 32 byte secure random key)
   :::

   Example:
   ```bash
    cat .env
    TOOLJET_HOST=http://localhost:8082
    LOCKBOX_MASTER_KEY=13c9b8364ae71f714774c82498ba328813069e48d80029bb29f49d0ada5a8e40
    SECRET_KEY_BASE=ea85064ed42ad02cfc022e66d8bccf452e3fa1142421cbd7a13592d91a2cbb866d6001060b73a98a65be57e65524357d445efae00a218461088a706decd62dcb
    NODE_ENV=development
    # DATABASE CONFIG
    PG_HOST=postgres
    PG_PORT=5432
    PG_USER=postgres
    PG_PASS=postgres
    PG_DB=tooljet_development
    ORM_LOGGING=all
   ```

   ```bash
    cat .env.test
    TOOLJET_HOST=http://localhost:8082
    LOCKBOX_MASTER_KEY=13c9b8364ae71f714774c82498ba328813069e48d80029bb29f49d0ada5a8e40
    SECRET_KEY_BASE=ea85064ed42ad02cfc022e66d8bccf452e3fa1142421cbd7a13592d91a2cbb866d6001060b73a98a65be57e65524357d445efae00a218461088a706decd62dcb
    NODE_ENV=test
    # DATABASE CONFIG
    PG_HOST=postgres
    PG_PORT=5432
    PG_USER=postgres
    PG_PASS=postgres
    PG_DB=tooljet_test
    ORM_LOGGING=error
   ```

4. Build docker images
   ```bash
    docker-compose build
   ```

5. ToolJet server is built using NestJS and the data such as application definitions are persisted on a postgres database. You have to create and migrate the database if building for the first time.
   ```bash
   docker-compose run --rm server npm run db:create
   docker-compose run --rm server npm run db:migrate
   docker-compose run --rm server npm run db:seed
   ```

6. Run ToolJet
   ```bash
    docker-compose up
   ```

7. ToolJet should now be served locally at `http://localhost:8082`. You can login using the default user created.
  ```
  email: dev@tooljet.io
  password: password
  ```


8.  To shut down the containers,
    ```bash
     docker-compose stop
    ```

## Making changes to the codebase

If you make any changes to the codebase/pull the latest changes from upstream, the tooljet server container would hot reload the application without you doing anything.

Caveat:

1. If the changes include database migrations or new npm package additions in the package.json, you would need to restart the ToolJet server container by running `docker-compose restart server`.

2. If you need to add a new binary or system libary to the container itself, you would need to add those dependencies in `docker/server.Dockerfile.dev` and then rebuild the ToolJet server image. You can do that by running `docker-compose build server`. Once that completes you can start everything normally with `docker-compose up`.

Example:
Let's say you need to install the `imagemagick` binary in your ToolJet server's container. You'd then need to make sure that `apt` installs `imagemagick` while building the image. The Dockerfile at `docker/server.Dockerfile.dev` for the server would then look something like this:
```
FROM node:14.17.0-buster

RUN apt update && apt install -y \
  build-essential  \
  postgresql \
  freetds-dev \
  imagemagick

RUN mkdir -p /app
WORKDIR /app

COPY ./server/package.json ./server/package-lock.json ./
RUN npm install

ENV NODE_ENV=development

COPY ./server/ ./

COPY ./docker/ ./docker/

COPY ./.env ../.env

RUN ["chmod", "755", "entrypoint.sh"]

```
Once you've updated the Dockerfile, rebuild the image by running `docker-compose build server`. After building the new image, start the services by running `docker-compose up`.


## Running tests

Test config picks up config from `.env.test` file at the root of the project.

Run the following command to create and migrate data for test db
```bash
docker-compose run --rm -e NODE_ENV=test server npm run db:create
docker-compose run --rm -e NODE_ENV=test server npm run db:migrate
```

To run the unit tests

```bash
$ docker-compose --rm run server npm run test
```

To run e2e tests

```bash
docker-compose run --rm server npm run test:e2e
```

To run a specific unit test
```bash
docker-compose run --rm server npm run test <path-to-file>
```

## Troubleshooting

Please open a new issue at https://github.com/ToolJet/ToolJet/issues or join our slack channel (https://join.slack.com/t/tooljet/shared_invite/zt-r2neyfcw-KD1COL6t2kgVTlTtAV5rtg) if you encounter any issues when trying to run ToolJet locally.

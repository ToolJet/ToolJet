---
id: docker
title: Docker
---

:::warning
The following guide is intended for contributors to set up ToolJet locally. If you're interested in **self-hosting** ToolJet, please refer to the **[Setup](/docs/setup/)** section.
:::

Docker Compose is the easiest way to set up the ToolJet server and client locally.

*If you just want to try out ToolJet locally with docker, you can follow the steps [here](/docs/setup/try-tooljet).*

## Prerequisites

Make sure you have the latest version of `docker` and `docker compose` installed.

**[Official docker installation guide](https://docs.docker.com/desktop/)**

**[Official docker-compose installation guide](https://docs.docker.com/compose/install/)**

## Setting up

:::warning
If you are setting up on a Windows machine, we advise you to set up Docker Desktop with WSL2. More information is available [here](https://docs.docker.com/desktop/windows/wsl/). 

Make sure to run it within the WSL2 terminal.
:::

1. Fork the repository:

   Go to the [ToolJet GitHub repository](https://github.com/ToolJet/Tooljet), click on the **Fork** button to create a copy of the repository under your own GitHub account.

2. Clone your forked repository:

   After forking, clone the forked repository to your local machine using the URL of your forked repo.

```bash
git clone https://github.com/<your-username>/ToolJet.git
```

3. Create a `.env` file by copying `.env.example`. More information on the variables that can be set is given in the **[environment variables reference](/docs/setup/env-vars)**.

```bash
cp ./deploy/docker/.env.internal.example .env
```

4. Populate the keys in the `.env` using the below the command: 

```bash
chmod +x ./deploy/docker/internal.sh && ./deploy/docker/internal.sh
```

:::warning
If you are setting up on a Windows machine, please ensure that the .env file line endings are set to LF, as they will be CRLF by default unless configured otherwise.
:::
   
5. Build Docker images.

```bash
docker compose build
docker compose run --rm  plugins npm run build:plugins
```

6. Run ToolJet.

```bash
docker compose up
```

   ToolJet should now be served locally at `http://localhost:8082`.

7. To shut down the containers, use the below commands:

```bash
docker compose stop
```

## Making changes to the codebase

If you make any changes to the codebase or pull the latest changes from upstream, the ToolJet server container will hot reload the application without any action required from you.

**Note:**

1. If the changes include database migrations or new npm package additions in `package.json`, you need to restart the ToolJet server container by running `docker compose restart server`.


2. If you need to add a new binary or system library to the container itself, you would need to add those dependencies in `docker/server.Dockerfile.dev` and then rebuild the ToolJet server image. You can do that by running `docker compose build server`. After the build completes, you can start all services by running `docker compose up`.


Example:
Let's say you need to install the `imagemagick` binary in your ToolJet server's container. You'd then need to make sure that `apt` installs `imagemagick` while building the image. The Dockerfile at `docker/server.Dockerfile.dev` for the server would then look something like this:

```bash
FROM node:18.18.2-buster AS builder

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

Once you've updated the Dockerfile, rebuild the image by running `docker compose build server`. After building the new image, start the services by running `docker compose up`.

## Running Tests

Test config picks up config from `.env.test` file at the root of the project.

1. Run the following command to create and migrate data for test db:

```bash
docker compose run --rm -e NODE_ENV=test server npm run db:create
docker compose run --rm -e NODE_ENV=test server npm run db:migrate
```

2. To run the unit tests:
```bash
docker compose run --rm server npm run --prefix server test
```

3. To run e2e tests:

```bash
docker compose run --rm server npm run --prefix server test:e2e
```

4. To run a specific unit test:

```bash
docker compose run --rm server npm --prefix server run test <path-to-file>
```

## Troubleshooting

Please open a new issue at https://github.com/ToolJet/ToolJet/issues or join our [Slack Community](https://tooljet.com/slack) if you encounter any issues when trying to run ToolJet locally.


## Debugging with Docker

In this section, we provide guidance on how to enable debugging for ToolJet services using Docker and Visual Studio Code. These additions will significantly benefit contributors by streamlining the debugging process and enhancing the overall development experience.


#### VSCode Launch Configuration:

A new configuration has been added in `.vscode/launch.json` to facilitate launching the client and server in debug mode. This allows contributors to easily debug the application within the Visual Studio Code environment. Configurations include:

- **Docker Debug Client**: Launch the client running in a Docker container for debugging within Visual Studio Code.
- **Docker Debug Server**: Debug the server in a Docker container, allowing developers to leverage Node.js debugging tools directly from their IDE.

#### VSCode Task Configuration:

A new task has been introduced in `.vscode/tasks.json` to manage Docker Compose commands for debugging. This includes tasks to start the client and server in detached mode, making it easier to initiate debugging sessions.

#### Docker Compose Debug Configuration:

The `docker-compose-debug.yaml` file defines the services for debugging, exposing the necessary port (9229) for Node.js debugging. This setup ensures that the server runs in debug mode, allowing for effective troubleshooting.

### Benefits of Debugging Configuration
These changes streamline the debugging process, making it more efficient for contributors to identify and fix issues. The integration with Visual Studio Code allows for advanced debugging features such as breakpoints and real-time variable inspection. Furthermore, standardizing the debugging setup fosters better collaboration among team members, facilitating knowledge sharing and improving the overall development workflow.

By implementing these configurations, ToolJet aims to enhance the development experience, enabling contributors to resolve issues swiftly and maintain project momentum.

If you want to run docker in debug mode use this command
```bash
docker-compose -f docker-compose.yaml -f docker-compose-debug.yaml up --build
```

**Open the Project in VSCode**: Open the ToolJet directory in Visual Studio Code.

Check Launch Configurations:
- Open the debug view by clicking on the Debug icon in the Activity Bar on the side of the window.
- Select the appropriate configuration, such as Docker Debug Client or Docker Debug Server.
---
id: docker-local
title: Try ToolJet locally
---

# Try ToolJet with Docker

:::info
This doc is not for setting up the development environment, it is only for trying out ToolJet locally using Docker. Check out [Contributing Guide](/docs/category/contributing-guide).
:::

You can run the command below to have ToolJet up and running right away.

```bash
docker run \
  --name tooljet \
  --restart unless-stopped \
  -p 3000:3000 \
  -v tooljet_data:/var/lib/postgresql/13/main \
  tooljet/try:latest
```

## Setup information

- Runs the ToolJet server on the port 3000 on your machine.
- Container has postgres already configured within. All the data will be available in the docker volume `tooljet_data`.
- Default user credentials to login (email: `dev@tooljet.io`, password: `password`).
- You can make use of `--env` or `--env-file` flag to test against various env configurables mentioned [here](https://docs.tooljet.com/docs/setup/env-vars).
- Use `docker stop tooljet` to stop the container and `docker start tooljet` to start the container thereafter.

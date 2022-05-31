---
id: docker-local
title: Docker Local
---

# Try ToolJet with Docker

You can run the command below to have tooljet up and running right away.

```bash
docker run \
  --name tooljet \
  --restart unless-stopped \
  -p 3000:3000 \
  -v tooljet_data:/var/lib/postgresql/13/main \
  tooljet/try:latest
```

## Setup information

- Runs the tooljet server on your port 3000.
- Container has posgres already configured within. All the data will be available in the docker volume `tooljet_data`.
- Default user credentials to login (email: `dev@tooljet.io`, password: `password`).
- You can make use of `--env` or `--env-file` flag to test against various env configurables mentioned [here](https://docs.tooljet.com/docs/setup/env-vars).
- Use `docker stop tooljet` to stop the container and `docker start tooljet` to start the container thereafter.

---
id: try-tooljet
title: Try ToolJet
---

# Try ToolJet

## Running ToolJet Locally with Docker

You can run the command below to have ToolJet up and running right away.

```bash
docker run \
  --name tooljet \
  --restart unless-stopped \
  -p 80:80 \
  --platform linux/amd64 \
  -v tooljet_data:/var/lib/postgresql/13/main \
  tooljet/try:EE-LTS-latest
```

#### Explanation

- `--name tooljet`: Names the container "tooljet".
- `--restart unless-stopped`: Automatically restarts the container unless it is explicitly stopped.
- `-p 80:80`: Maps port 80 of the host to port 80 of the container.
- `--platform linux/amd64`: Ensures the container uses the correct platform.
- `-v tooljet_data:/var/lib/postgresql/13/main`: Creates a Docker volume named `tooljet_data` - for persistent storage of PostgreSQL data.

#### Using the Correct Platform with Docker

- macOS:

Intel-based Macs: Use `linux/amd64`.

Apple Silicon (M1 and M2): Use `linux/arm64`.

- Windows:

Most modern Windows systems use `linux/amd64`.

#### Setup information

- ToolJet will run on port 80 of your machine.
- The container includes a pre-configured PostgreSQL database.
- Data will be stored in the Docker volume `tooljet_data`.

#### Environment Variables

You can customize the environment settings using `--env` or `--env-file` flags.

#### Stopping and Starting the Container

- To stop the container, use: `docker stop tooljet`
- To start the container again, use: `docker start tooljet`

#### Running on a Different Port

To run ToolJet on a different port (e.g., port 8080), use the following command:

```sh
docker run \
  --name tooljet \
  --restart unless-stopped \
  -p 8080:8080 \
  -e PORT=8080 \
  --platform linux/amd64 \
  -v tooljet_data:/var/lib/postgresql/13/main \
  tooljet/try:EE-LTS-latest
```

#### Explanation

- This command will start the ToolJet server on port 8080.
- The `-e PORT=8080` flag sets the `PORT` environment variable to 8080, allowing the ToolJet server to listen on port 8080.

By following these instructions, you can easily run the ToolJet server on the port of your choice, ensuring flexibility in your setup.

## Need Help ?

If you have any questions, feel free to:

- Join our [Slack Community](https://tooljet.com/slack)
- Send us an email at hello@tooljet.com

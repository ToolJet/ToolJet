---
id: try-tooljet
title: Try ToolJet
---

# Try ToolJet

## On local with Docker

You can run the command below to have ToolJet up and running right away.

```bash
docker run \
  --name tooljet \
  --restart unless-stopped \
  -p 80:80 \
  --platform linux/amd64 \
  -v tooljet_data:/var/lib/postgresql/13/main \
  tooljet/try:latest
```
*If you have any questions feel free to join our [Slack Community](https://tooljet.com/slack) or send us an email at hello@tooljet.com.*


#### Setup information

- Runs the ToolJet server on the port 80 on your machine.
- Container has postgres already configured within. All the data will be available in the docker volume `tooljet_data`.
- You can make use of `--env` or `--env-file` flag to test against various env configurables mentioned [here](https://docs.tooljet.com/docs/setup/env-vars).
- Use `docker stop tooljet` to stop the container and `docker start tooljet` to start the container thereafter.

#### Dynamic Port Setup
To run the ToolJet server on a different port, such as 8080 or any other port of your choice, use the following command:

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

- This command will start the ToolJet server on port 8080.
- The `-e PORT=8080` flag sets the `PORT` environment variable to 8080, allowing the ToolJet server to listen on port 8080.

By following these instructions, you can easily run the ToolJet server on the port of your choice, ensuring flexibility in your setup.

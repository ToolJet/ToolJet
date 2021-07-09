---
sidebar_position: 2
sidebar_label: Docker
---
:::info
You should setup a PostgreSQL database manually to be used by the ToolJet server.
:::

# Deploying ToolJet using docker-compose

Follow the steps below to deploy ToolJet ( both server & client ) on a server using docker-compose:

1. Setup a PostgreSQL database and make sure that the database is accessible.

2. Install docker and docker-compose on the server.  
[Docker Installation](https://docs.docker.com/engine/install/)   
[Docker Compose Installation](https://docs.docker.com/compose/install/)   

3. Download our production docker-compose file into the server by running:
`curl -LO https://raw.githubusercontent.com/ToolJet/ToolJet/develop/deploy/docker/docker-compose.yaml`

4. Create an `.env` file in the current directory (where the docker-compose.yaml file is downloaded) and populate all the required
   keys. (Read [environment variables reference](/docs/deployment/env-vars))

  `TOOLJET_HOST` environment variable determines where you can access the ToolJet client. It can either be the public ipv4 address of your server or a custom domain that you want to use.

   Examples:   
   `TOOLJET_HOST=http://12.34.56.78` or   
   `TOOLJET_HOST=https://yourdomain.com` or   
   `TOOLJET_HOST=https://tooljet.yourdomain.com`

   
  :::info
   We use a [lets encrypt](https://letsencrypt.org/) plugin on top of nginx to create TLS certificates on the fly.
  :::

  :::info
   Please make sure that `TOOLJET_HOST` starts with either `http://` or `https://`
  :::

5. Once you've populated the `.env` file, run `docker-compose up -d` to start all the required services. 
  :::info
    If you're running on a linux server, `docker` might need sudo permissions. In that case you can either run:
    `sudo docker-compose up -d`    
    OR   
    Setup docker to run without root privilages by following the instructions written here https://docs.docker.com/engine/install/linux-postinstall/ 
  :::

6.  If you've set a custom domain for `TOOLJET_HOST`, add a `A record` entry in your DNS settings to point to the IP address of the      server.

7.  You're all done, ToolJet client would now be served at the value you've set in `TOOLJET_HOST`.

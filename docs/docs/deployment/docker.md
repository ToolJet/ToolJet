---
sidebar_position: 2
sidebar_label: Docker
---

# Deploying ToolJet using docker-compose

:::info
You should setup a PostgreSQL database manually to be used by the ToolJet server.
:::

Follow the steps below to deploy ToolJet on a server using docker-compose. This setup will deploy both ToolJet server and ToolJet client.

1. Setup a PostgreSQL database and make sure that the database is accessible.

2. Make sure that the server can receive traffic on port 80, 443 and 22.   
For example, if the server is an AWS EC2 instance and the installation should receive traffic from the internet, the inbound rules of the security group should look like this:

   protocol| port     | allowed_cidr|
   ----| -----------  | ----------- |
   tcp | 22           | your IP |
   tcp | 80           | 0.0.0.0/0 |
   tcp | 443          | 0.0.0.0/0   |

3. Install docker and docker-compose on the server.  
[Docker Installation](https://docs.docker.com/engine/install/)   
[Docker Compose Installation](https://docs.docker.com/compose/install/)   

4. Download our production docker-compose file into the server by running:
  ```bash
   curl -LO https://raw.githubusercontent.com/ToolJet/ToolJet/main/deploy/docker/docker-compose.yaml
  ```

5. Create `.env` file in the current directory (where the docker-compose.yaml file is downloaded):

  ```bash
     curl -LO https://raw.githubusercontent.com/ToolJet/ToolJet/main/.env.example 
     mv .env.example .env
  ```

  Set up environment variables in `.env` file as explained in [environment variables reference](/docs/deployment/env-vars)

   
  `TOOLJET_HOST` environment variable can either be the public ipv4 address of your server or a custom domain that you want to use.

  :::info
  We use a [lets encrypt](https://letsencrypt.org/) plugin on top of nginx to create TLS certificates on the fly.
  :::

  Examples:   
  `TOOLJET_HOST=http://12.34.56.78` or   
  `TOOLJET_HOST=https://yourdomain.com` or   
  `TOOLJET_HOST=https://tooljet.yourdomain.com`   

  :::info
   Please make sure that `TOOLJET_HOST` starts with either `http://` or `https://`
  :::

6. Once you've populated the `.env` file, run 

  ```bash
     docker-compose up -d
  ``` 
  to start all the required services. 

  :::info
    If you're running on a linux server, `docker` might need sudo permissions. In that case you can either run:
    `sudo docker-compose up -d`    
    OR   
    Setup docker to run without root privilages by following the instructions written here https://docs.docker.com/engine/install/linux-postinstall/ 
  :::

7.  If you've set a custom domain for `TOOLJET_HOST`, add a `A record` entry in your DNS settings to point to the IP address of the      server.

8.  Seed the database:
  ```bash
  docker-compose run server npm run db:seed
  ```
  This seeds the database with a default user with the following credentials:   
    email: `dev@tooljet.io`   
    password: `password`
    

9.  You're all done, ToolJet client would now be served at the URL you've set in `TOOLJET_HOST`.

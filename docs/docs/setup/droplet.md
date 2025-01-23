---
id: droplet
title:  Digital Ocean Droplet
---

# Deploying ToolJet on Digital Ocean Droplet

Follow the steps below to deploy ToolJet on Digital Ocean Droplet

1. Navigate to "**Droplets**" in Digital ocean
   
 
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/setup/digitalocean/droplet_1.png" alt="create a Droplet" />

  </div>

2. Configure the droplet with the following options:
   
 - **Image**: Ubuntu 
 - **Plan**: Choose a plan (e.g., Basic, 4GB RAM, 2 vCPU)

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/setup/digitalocean/droplet_plan.png" alt="use a droplet plan" />
  
  </div>
  

  - **Auth**: For authentication use password or ssh
  - Click "**Create Droplet**" and note the assigned public IP

3. Create a Firewall for the Droplet to allow required ports
   
   protocol| port     | allowed_cidr|
   ----| -----------  | ----------- |
   tcp | 22           | your IP     |
   tcp | 80           | 0.0.0.0/0   |
   tcp | 443          | 0.0.0.0/0   |

4. Connect to the Droplet via **SSH**
 
5. Install Docker & Docker Compose

Run the following commands to install Docker and Docker Compose:

```
apt update && apt upgrade -y
apt install -y docker.io
```

Enable and start Docker:

```
systemctl enable docker 
systemctl start docker
```

Install Docker Compose:

```
apt install -y curl 
curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose 
chmod +x /usr/local/bin/docker-compose
```

Verify installation:

```
docker --version 
docker-compose --version
```

6. Update the `TOOLJET_HOST` in the `.env` file

`TOOLJET_HOST=http://<public_ip>:80`

7. Use the [Docker Docs](https://docs.tooljet.com/docs/setup/docker) to deploy ToolJet

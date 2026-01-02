---
id: digitalocean
title: DigitalOcean
---

Follow the steps below to deploy ToolJet on a DigitalOcean Droplet.

:::warning
To use ToolJet AI features in your deployment, make sure to whitelist `https://api-gateway.tooljet.com` and `https://python-server.tooljet.com` in your network settings.
:::

**1. Navigate to the Droplets section in DigitalOcean.**

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/setup/digitalocean/droplet_1.png" alt="create a Droplet" />

  </div>

**2. Configure the **Droplet** with the following options:**

- **Image**: Ubuntu
- **Plan**: Choose a plan (e.g., Basic, 4GB RAM, 2 vCPU)

  <div style={{textAlign: 'center'}}>
     <img className="screenshot-full" src="/img/setup/digitalocean/droplet_plan.png" alt="use a droplet plan" />
  </div>

  - **Auth**: For authentication, use password or ssh
  - Click **Create Droplet** and note the assigned public IP

**3. Create a Firewall for the Droplets to allow required ports:**

:::info Required Inbound Firewall Rules

- **Port 22 (SSH)** - TCP
  - Allowed CIDR: Your IP address only
  - Purpose: Secure administrative access to the Droplet

- **Port 80 (HTTP)** - TCP
  - Allowed CIDR: `0.0.0.0/0` (all sources)
  - Purpose: Public web access to ToolJet

- **Port 443 (HTTPS)** - TCP
  - Allowed CIDR: `0.0.0.0/0` (all sources)
  - Purpose: Secure public web access to ToolJet

:::tip
For enhanced security, restrict SSH access (port 22) to your specific IP address only. HTTP and HTTPS ports should remain open to all sources for public access to your ToolJet instance.
:::

**4. Connect to the **Droplets** via SSH.**

**5. Install Docker and Docker Compose using the following commands:**

```bash
apt update && apt upgrade -y
apt install -y docker.io
```

Enable and start Docker:

```bash
systemctl enable docker
systemctl start docker
```

Install Docker Compose:

```bash
apt install -y curl
curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

Verify installation:

```bash
docker --version
docker-compose --version
```

**6. Update the `TOOLJET_HOST` in the `.env` file:**

`TOOLJET_HOST=http://<public_ip>:80`

**7. Use the [Docker Documentation](https://docs.tooljet.com/docs/setup/docker) to deploy ToolJet.**

## Upgrading to the Latest LTS Version

:::info
If this is a new installation of the application, you may start directly with the latest version. This upgrade guide is only for existing installations.
:::

New LTS versions are released every 3-5 months with an end-of-life of atleast 18 months. To check the latest LTS version, visit the [ToolJet Docker Hub](https://hub.docker.com/r/tooljet/tooljet/tags) page. The LTS tags follow a naming convention with the prefix `LTS-` followed by the version number, for example `tooljet/tooljet:ee-lts-latest`.

### Prerequisites for Upgrading

:::warning
**Critical: Backup Your PostgreSQL Instance**

Before starting the upgrade process, perform a **comprehensive backup of your PostgreSQL instance** to prevent data loss. Your backup must include both required databases:

1. **PG_DB** (Application Database) - Contains users, apps, and configurations
2. **TOOLJET_DB** (Internal Database) - Contains ToolJet Database feature data

Ensure both databases are included in your backup before proceeding with the upgrade.
:::


- Users on versions earlier than **v2.23.0-ee2.10.2** must first upgrade to this version before proceeding to the latest LTS version.

---

_If you have any questions feel free to join our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA) or send us an email at support@tooljet.com._

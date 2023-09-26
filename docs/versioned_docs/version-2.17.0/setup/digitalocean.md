---
id: digitalocean
title: DigitalOcean
---

# Deploying ToolJet on DigitalOcean

Now you can quickly deploy ToolJet using the Deploy to DigitalOcean button.

*If you have any questions feel free to join our [Slack Community](https://tooljet.com/slack) or send us an email at hello@tooljet.com.*

The latest docker image is `tooljet/tooljet:v2.13.1-ee2.5.2`

## Deploying

#### Follow the steps below to deploy ToolJet on DigitalOcean:

1. Once signed-in to your DigitalOcean account, click on the **Create App** button. 
  
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/setup/digitalocean/1.png" alt="ToolJet - Deploy on DigitalOcean" />

  </div>

2. On the next page, you'll be asked to choose a **Resource** type, select **Docker Hub**. Enter the Repository name as `tooljet/tooljet` and the corresponding tag.

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/setup/digitalocean/2.png" alt="ToolJet - Deploy on DigitalOcean" />

  </div>

3. Once the Resource is created, you'll be redirected to the **Resources** page. Click on the **Edit** button next to the Resource.

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/setup/digitalocean/3.png" alt="ToolJet - Deploy on DigitalOcean" />

  </div>
  
  Make sure the **Run Command** is `./server/scripts/digitalocean-build.sh` and the **HTTP** port is `3000`. Once you have edited the ToolJet resource click on the **Back** button.

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/setup/digitalocean/4.png" alt="ToolJet - Deploy on DigitalOcean" />

  </div>

### Redis setup

ToolJet requires configuring Redis which is used for enabling multiplayer editing and for background jobs.

Follow the steps below to configure Redis database:

1. Navigate to **Database** and create a database cluster.

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/setup/digitalocean/5.png" alt="ToolJet - Deploy on DigitalOcean" />

  </div>

2. Select `Redis` from the database engine and add a unique name to the cluster and click on **Create Database cluster**.

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/setup/digitalocean/6.png" alt="ToolJet - Deploy on DigitalOcean" />

  </div>

3. Once the set-up is complete, add the Redis connection string in the environmental variable of `tooliet-app`.
  :::info
  In the business edition, saving or making changes in apps is dependent on Redis, even if multi-player editing is not necessary.
  :::
  
### Database setup

Follow the below steps to attach a postgresql database:

1. Click on **Add Resource** and select **Database** and click on add.

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/setup/digitalocean/7.png" alt="ToolJet - Deploy on DigitalOcean" />

  </div>

2. Enter the preffered name for the database and click **Create and attach**.

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/setup/digitalocean/8.png" alt="ToolJet - Deploy on DigitalOcean" />

  </div>

### Setting up environment variables

1. Once the database is attached, click on **Next** to set up the environment variables.

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/setup/digitalocean/9.png" alt="ToolJet - Deploy on DigitalOcean" />

  </div>

2. Click on **Edit** next to `tooljet-app`.

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/setup/digitalocean/10.png" alt="ToolJet - Deploy on DigitalOcean" />

  </div>

3. Click on the build editor to edit the environment variables.

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/setup/digitalocean/11.png" alt="ToolJet - Deploy on DigitalOcean" />

  </div>

  ```bash
  NODE_ ENV=production
  NODE_OPTIONS=--max-old-space-size=4096
  LOCKBOX MASTER_KEY= #Use `openssl rand -hex 32`
  SECRET KEY BASE= #Use `openssl rand -hex 64`
  DEPLOYMENT_PLATFORM=digitalocean
  DATABASE_URL=${<enter the db name which was attached>.DATABASE_URL}
  CA CERT=${<enter the db name which was attached>.CA_CERT}
  TOOLJET HOST=${APP_URL} 
  TOOLJET_SERVER_URL=${APP_URL} 
  REDIS_URL= #connection string
  ```

  DATABASE_URL and CA_CERT variable should be added in the above format.

4. After adding the environment variables, click on **Save**.

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/setup/digitalocean/12.png" alt="ToolJet - Deploy on DigitalOcean" />

  </div>

  To add additional environment variables, refer this [doc](https://docs.tooljet.com/docs/setup/env-vars/).

### Licensing

Enterprise edition needs a private license key to work. Please contact us if you don't have a license key.

Follow these steps to update your license key:
  1. Login as a Super Admin.
  2. Navigate to **[Instance settings](https://docs.tooljet.com/img/licensing/licensingpage1.png)** menu & click on License tab.
  3. Update your license key.

**Note that this license key is private to your account and sharing this with anyone else is strictly prohibited.**

### Marketplace

To be able to install plugins from the marketplace, it's required to turn on the feature using the environment variable mentioned below:
```bash
ENABLE MARKETPLACE FEATURE=true
```

Learn more about the marketplace [here](https://docs.tooljet.com/docs/marketplace/marketplace-overview/).

### ToolJet Database

Use the ToolJet-hosted database to build apps faster, and manage your data with ease. ToolJet database requires no setup and gives you a powerful user interface for managing your data.

You can refer docs [here](https://docs.tooljet.com/docs/setup/digitalocean#database-setup), if you require ToolJet Database set-up.

### Updating version

When a new version is released the team will communicate with the change-log which will contain all the latest features, bug fixes and any configuration changes(applicable only if any).

We will share the latest version's tag to which it can be updated. To upgrade to the new version you will have need to change the image tag in the deployment yaml file.

:::info
Before upgrading please take back-up of the database used by production instance.
1. Also to be on a safer side creating a staging instance is recommended, so the latest version can be tested in the staging instance using the app imported from production instance and then upgrade the production instance.
2. This will help you to understand how the production app is behaving with the latest version.
:::

:::tip
1. If there are self signed HTTPS endpoints that Tooljet needs to connect to, please make sure that NODE_EXTRA_CA_CERTS environment variable is set to the absolute path containing the certificates.
2. Tooljet do not support SSL termination. If you require ssl termination you would have to delegate it using a load balancer or reverse proxy.
:::
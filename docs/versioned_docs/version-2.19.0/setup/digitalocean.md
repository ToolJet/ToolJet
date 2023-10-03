---
id: digitalocean
title: DigitalOcean
---

# Deploying ToolJet on DigitalOcean

Now you can quickly deploy ToolJet using the Deploy to DigitalOcean button.

*If you have any questions feel free to join our [Slack Community](https://tooljet.com/slack) or send us an email at hello@tooljet.com.*

The latest docker image is `tooljet/tooljet:<version_tag>`

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
  
  Make sure the **Run Command** is `./server/scripts/digitalocean-postbuild` and the **HTTP** port is `3000`. Once you have edited the ToolJet resource click on the **Back** button.

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

#### Deploying Tooljet Database

If you intend to use this feature, you'd have to set up and deploy PostgREST server which helps querying ToolJet Database.
You can learn more about this feature [here](/docs/tooljet-database).

Follow the steps below to deploy ToolJet Database on DigitalOcean:

1. If you are using dev database within ToolJet deployment, upgrade it to managed database. You could also add a separate database, if you intent use a different database, please refer the [environment variables](/docs/setup/env-vars#enable-tooljet-database--optional-) for additional env variables. 

2. Create a new app for PostgREST server. You can opt for docker hub to deploy PostgREST image of version `10.1.x`.

  <img className="screenshot-full" src="/img/setup/digitalocean/postgrest-build.png" alt="ToolJet - Deploy on DigitalOcean - PostgREST resource" />

3. Update the [environment variables](/docs/setup/env-vars#postgrest-server-optional) for PostgREST and expose the HTTP port `3000`.

  <img className="screenshot-full" src="/img/setup/digitalocean/postgrest-env.png" alt="ToolJet - Deploy on DigitalOcean - PostgREST environment variables" />

4. Add your newly created PostgREST app to the trusted sources of your managed or separate database.

5. Update your existing ToolJet application deployment with [environment variables](/docs/setup/env-vars#enable-tooljet-database--optional-) required for PostgREST. 

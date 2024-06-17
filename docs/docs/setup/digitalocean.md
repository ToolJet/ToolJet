---
id: digitalocean
title: DigitalOcean
---

# Deploying ToolJet On DigitalOcean

You can deploy ToolJet using the Deploy to DigitalOcean button.

If you have any questions, feel free to join our [Slack Community](https://tooljet.com/slack) or send us an email at hello@tooljet.com.

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Redis setup

:::info
ToolJet requires configuring Redis, which is used for enabling multiplayer editing and for background jobs.
:::

Follow the steps below to configure the Redis database:

- Navigate to **Database** and create a database cluster.

  <div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/setup/digitalocean/5.png" alt="ToolJet - Deploy on DigitalOcean" />
  </div>

- Select `Redis` from the database engine and add a unique name to the cluster and click on **Create Database cluster**.

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/setup/digitalocean/6.png" alt="ToolJet - Deploy on DigitalOcean" />

  </div>

- Once the setup is complete, add the Redis connection string in the environmental variable of `tooljet-app`.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Deploying

#### Follow the steps below to deploy ToolJet on DigitalOcean:

1. Click on the button below to start one-click deployment.

  <div style={{textAlign: 'center'}}>

  [![Deploy to DigitalOcean](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/ToolJet/ToolJet/tree/main)

  </div>

2. A new tab will open up, sign in to your DigitalOcean account. Once signed in, the **Create App** page will open up and **Resources** will be already selected. Click on the **Next** button.

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/setup/digitalocean/resources.png" alt="ToolJet - Deploy on DigitalOcean - Resources" />

  </div>

3. Now, on **Environment Variables** page you can add new variables, or edit the existing ones. Check the [environment variables here](/docs/setup/env-vars).

  Also, please add the Redis URL in the environment variable `REDIS_URL= #connection string`

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/setup/digitalocean/env.png" alt="ToolJet - Deploy on DigitalOcean - Environment Variables" />

  </div>

4. On the next page, you can change the **App name**, **Project**, and **Region**.

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/setup/digitalocean/region.png" alt="ToolJet - Deploy on DigitalOcean - Launch" />

  </div>

5. On the last page, you'll be asked to **Review** all the app details such as **Resources**, **Environment Variables**, **Region**, and there will also be **Billing** section at the end. Review all the details and click the **Create Resource** button.

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/setup/digitalocean/review.png" alt="ToolJet - Deploy on DigitalOcean - Launch" />

  </div>

6. Once you click the **Create Resource** button, the build will begin. Once the build is complete, you'll see the resource and a **URL** next to it. Click on the URL to open the deployed **ToolJet**.

:::tip
The ToolJet server and client can be deployed as standalone applications. If you do not want to deploy the client on DigitalOcean, modify `package.json` accordingly. We have a [guide](/docs/setup/client) on deploying the ToolJet client using services such as Firebase.
:::

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Deploying ToolJet Database

If you intend to use this feature, you'd have to set up and deploy the PostgREST server which helps in querying ToolJet Database.
You can learn more about this feature [here](/docs/tooljet-database).

Follow the steps below to deploy ToolJet Database on DigitalOcean:

1. If you are using dev database within ToolJet deployment, upgrade it to managed database. You could also add a separate database, if you intent use a different database, please refer the [environment variables](/docs/setup/env-vars#enable-tooljet-database--optional-) for additional env variables. 

2. Create a new app for PostgREST server. You can opt for Docker Hub to deploy PostgREST image of version `10.1.x`.

  <img className="screenshot-full" src="/img/setup/digitalocean/postgrest-build.png" alt="ToolJet - Deploy on DigitalOcean - PostgREST resource" />

3. Update the [environment variables](/docs/setup/env-vars#postgrest-server-optional) for PostgREST, and expose the HTTP port `3000`.

  <img className="screenshot-full" src="/img/setup/digitalocean/postgrest-env.png" alt="ToolJet - Deploy on DigitalOcean - PostgREST environment variables" />

4. Add your newly created PostgREST app to the trusted sources of your managed or separate database.

5. Update your existing ToolJet application deployment with the the [environment variables](/docs/setup/env-vars#enable-tooljet-database--optional-) required for PostgREST. 

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Upgrading to the Latest LTS Version

New LTS versions are released every 3-5 months with an end-of-life of at least 18 months. To check the latest LTS version, visit [ToolJet Docker Hub](https://hub.docker.com/r/tooljet/tooljet/tags) page. The LTS tags follow a naming convention with the prefix `LTS-` followed by the version number, for example,  `tooljet:EE-LTS-latest`.

If this is a new installation of the application, you may start directly with the latest version. This guide is not required for new installations.

#### Prerequisites for Upgrading to the Latest LTS Version:

- It is crucial to perform a **comprehensive backup of your database** before starting the upgrade process to prevent data loss.

- Users on versions earlier than **v2.23.0-ee2.10.2** must first upgrade to v2.23.0-ee2.10.2 before proceeding to the LTS version.

For specific issues or questions, refer to our **[Slack](https://tooljet.slack.com/join/shared_invite/zt-25438diev-mJ6LIZpJevG0LXCEcL0NhQ#)**.

</div>
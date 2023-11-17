---
id: digitalocean
title: DigitalOcean
---

# Deploying ToolJet on DigitalOcean

Now you can quickly deploy ToolJet using the Deploy to DigitalOcean button.

*If you have any questions feel free to join our [Slack Community](https://tooljet.com/slack) or send us an email at hello@tooljet.com.*

## Deploying

#### Follow the steps below to deploy ToolJet on DigitalOcean:


1. Click on the button below to start one click deployment

  <div style={{textAlign: 'center'}}>

  [![Deploy to DigitalOcean](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/ToolJet/ToolJet/tree/main)

  </div>

2. A new tab will open up, sign-in to your DigitalOCean account. Once signed-in, the **Create App** page will open up and **Resources** will be already selected. Click on **Next** button.

  <img className="screenshot-full" src="/img/setup/digitalocean/resources.png" alt="ToolJet - Deploy on DigitalOcean - Resources" />

3. Now, on **Environment Variables** page you can add new variables or edit the existing ones. Check the [environment variables here](/docs/setup/env-vars).

  <img className="screenshot-full" src="/img/setup/digitalocean/env.png" alt="ToolJet - Deploy on DigitalOcean - Environment Variables" />

4. On the next page, you can change the **App name**, **Project**, and the **Region**.

  <img className="screenshot-full" src="/img/setup/digitalocean/region.png" alt="ToolJet - Deploy on DigitalOcean - App name" />

5. On the last page, you'll be asked to **Review** all the app details such that we entered before such as **Resources**, **Environment Variables**, **Region**, and there will also be **Billing** section at the end. Review all the details and click the **Create Resource** button.

   <img className="screenshot-full" src="/img/setup/digitalocean/review.png" alt="ToolJet - Deploy on DigitalOcean - App name" />

6. Once you click the **Create Resource** button, the build will begin. Once the build is complete, you'll see the resource and a **URL** next to it. Click on the URL to open the deployed **ToolJet**.

:::tip
ToolJet server and client can be deployed as standalone applications. If you do not want to deploy the client on DigitalOcean, modify `package.json` accordingly. We have a [guide](/docs/setup/client) on deploying ToolJet client using services such as Firebase.
:::
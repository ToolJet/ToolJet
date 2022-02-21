---
sidebar_position: 3
sidebar_label: Heroku
---

# Deploying ToolJet on Heroku

Follow the steps below to deploy ToolJet on Heroku:

1. Click the button below to start one click deployment.  
   <div style={{textAlign: 'center'}}>

   [![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/tooljet/tooljet/tree/main)

   </div>

2. Navigate to Heroku dashboard and go to resources tab to verify that the dyno is turned on.
3. Go to settings tab on Heroku dashboard and select `reveal config vars` to configure additional environment variables that your installation might need.

   Read **[environment variables reference](/docs/deployment/env-vars)**

4. Open the app.
5. The default username of the admin is `dev@tooljet.io` and the password is `password`.

:::tip
The one click deployment will create a free dyno and a free postgresql database.
:::

:::tip
ToolJet server and client can be deployed as standalone applications. If you do not want to deploy the client on Heroku, modify `package.json` accordingly. We have a [guide](/docs/deployment/client) on deploying ToolJet client using services such as Firebase.
:::

---
sidebar_position: 2
sidebar_label: Heroku
---

# Deploying ToolJet server on Heroku

Follow the steps below to deploy ToolJet ( both server & client ) on Heroku:

1. Click the buttons bewlow to start one click deployment.  
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/tooljet/tooljet/tree/main)

2. Navigate to Heroku dashboard and go to resources tab to verify that the dyno is turned on.
3. Go to settings tab on Heroku dashboard and select 'reveal config vars'.
4. Configure the mandatory environment variables as per the documentation.
5. The default username of the admin is dev@tooljet.io and password is password.

:::warning
The one click deployment will create a free dyno and a free postgresql database.
:::

:::tip
ToolJet server and client are standalone applications. If you do not want to deploy the client on Heroku, modify `package.json` accordingly.
:::
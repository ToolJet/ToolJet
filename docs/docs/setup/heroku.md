---
sidebar_position: 2
sidebar_label: Heroku + Firebase
---

# Deploying ToolJet server on Heroku

Follow the steps below to deploy ToolJet server on Heroku:

1. Click the buttons bewlow to start one click deployment.  
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/tooljet/tooljet/tree/main)

2. Navigate to Heroku dashboard and go to resources tab to verify that the dyno is turned on.
3. Go to settings tab on Heroku dashboard and select 'reveal config vars'.
4. Configure the mandatory environment variables as per the documentation.

:::warning
The one click deployment will create a free dyno and a free postgresql database.
:::

# Deploying ToolJet client on Firebase

Follow the steps below to deploy ToolJet client on Firebase:

1. Initialize firebase project
    ```bash
    $ firebase init 
    ```
    Select Firebase Hosting and set build as the static file directory
2. Deploy client to Firebase
    ```bash 
    $ firebase deploy
    ```
:::tip
If you want to run ToolJet on your local machine, please checkout the setup section of the contributing guide: [link](/docs/contributing-guide/setup/docker)
:::

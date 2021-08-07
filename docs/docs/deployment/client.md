---
sidebar_position: 6
---

# Deploying ToolJet client

ToolJet client is a standalone application and can be deployed on static website hosting services such as Netlify, Firebase, S3/Cloudfront, etc.

## Deploying ToolJet client on Firebase

:::tip
You should set the environment variable `TOOLJET_SERVER_URL` ( URL of the server ) while building the frontend.

For example: `TOOLJET_SERVER_URL=https://server.tooljet.io npm run build && firebase deploy`
:::

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

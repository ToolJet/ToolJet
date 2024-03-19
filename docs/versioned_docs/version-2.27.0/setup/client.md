---
id: client
title: Deploying ToolJet client
---

# Deploying ToolJet client

ToolJet client is a standalone application and can be deployed on static website hosting services such as Netlify, Firebase, S3/Cloudfront, etc.

You can build standalone client with the below command:
```bash
SERVE_CLIENT=false npm run build
```

*If you have any questions feel free to join our [Slack Community](https://tooljet.com/slack) or send us an email at hello@tooljet.com.*

## Deploying ToolJet client on Firebase

:::tip
You should set the environment variable `TOOLJET_SERVER_URL` ( URL of the server ) while building the frontend and also set `SERVE_CLIENT` to `false`` for standalone client build.

For example: `SERVE_CLIENT=false TOOLJET_SERVER_URL=https://server.tooljet.com npm run build && firebase deploy`
:::

1. Initialize firebase project
   ```bash
    firebase init
   ```
   Select Firebase Hosting and set build as the static file directory
2. Deploy client to Firebase
   ```bash
    firebase deploy
   ```

## Deploying ToolJet client with Google Cloud Storage

:::tip
You should set the environment variable `TOOLJET_SERVER_URL` ( URL of the server ) while building the frontend.


For example: `SERVE_CLIENT=false TOOLJET_SERVER_URL=https://server.tooljet.io npm run build`
:::

#### Using Load balancer

Tooljet client can be hosted from Cloud Storage bucket just like hosting any other static website.
Follow the instructions from google documentation [here](https://cloud.google.com/storage/docs/hosting-static-website).

Summarising the steps below:
1. Create a bucket and upload files within the build folder such that the `index.html` is at the bucket root.

2. Edit permissions for the bucket to assign *New principal* as `allUsers` with role as `Storage Object Viewer` and permit for public access for the bucket.

3. Click on *Edit website configuration* from the [buckets browser](https://console.cloud.google.com/storage/browser?_ga=2.180838119.1530169400.1637242882-657891227.1637242882) and specify the main page as `index.html`

4. Follow the [instructions](https://cloud.google.com/storage/docs/hosting-static-website#lb-ssl) on creating a load balancer for hosting a static website.

5. Optionally, create Cloud CDN to use with the backend bucket assigned to the load balancer.

6. After the load balancer is created there will be an IP assigned to it. Try hitting it to check the website is being loaded.

7. Use the load balancer IP as the static IP for the A record of your domain.

#### Using Google App Engine

1. Upload the build folder onto a bucket

2. Upload `app.yaml` file onto bucket with the following config

   ```yaml
   runtime: python27
   api_version: 1
   threadsafe: true

   handlers:
   - url: /
     static_files: build/index.html
     upload: build/index.html

   - url: /(.*)
     static_files: build/\1
     upload: build/(.*)
   ```

3. Activate cloud shell on your browser and create build folder
   ```bash
   mkdir tooljet-assets
   ```

4. Copy the uploaded files onto an assets folder which is to be served
   ```bash
   gsutil rsync -r gs://your-bucket-name/path-to-assets ./tooljet-assets
   ```

5. Deploy static assets to be served
   ```bash
   cd tooljet-assets && gcloud app deploy
   ```

## Upgrading to the Latest Version

The latest version includes architectural changes and, hence, comes with new migrations.

If this is a new installation of the application, you may start directly with the latest version. This guide is not required for new installations.

#### Prerequisites for Upgrading to the Latest Version:

- It is **crucial to perform a comprehensive backup of your database** before starting the upgrade process to prevent data loss.

- Ensure that your current version is v2.23.3-ee2.10.2 before upgrading. 

- Users on versions earlier than v2.23.3-ee2.10.2 must first upgrade to this version before proceeding to the latest version.

For specific issues or questions, refer to our **[Slack](https://tooljet.slack.com/join/shared_invite/zt-25438diev-mJ6LIZpJevG0LXCEcL0NhQ#)**.

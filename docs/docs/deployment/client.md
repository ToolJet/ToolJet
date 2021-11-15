---
sidebar_position: 8
---

# Deploying ToolJet client

ToolJet client is a standalone application and can be deployed on static website hosting services such as Netlify, Firebase, S3/Cloudfront, etc.

## Deploying ToolJet client on Firebase

:::tip
You should set the environment variable `TOOLJET_SERVER_URL` ( URL of the server ) while building the frontend.

For example: `NODE_ENV=production TOOLJET_SERVER_URL=https://server.tooljet.io npm run build && firebase deploy`
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

## Deploying ToolJet client on Google Cloud Storage

:::tip
You should set the environment variable `TOOLJET_SERVER_URL` ( URL of the server ) while building the frontend.

For example: `NODE_ENV=production TOOLJET_SERVER_URL=https://server.tooljet.io npm run build && firebase deploy`
:::

1. Copy the build folder onto a bucket

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

3. Active cloud shell on your browser and create build folder
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

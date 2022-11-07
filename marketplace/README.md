# Tooljet marketplace

## Steps to install npm package to a plugin

```bash
npm i <npm-package-name> --workspace=<plugin-name-in-package-json>
```

## Steps to build

```bash
npm install
npm run build --workspaces
```

## Update the plugins to S3 bucket

```bash
AWS_ACCESS_KEY_ID=<key> SECRET_ACCESS_KEY=<secret> AWS_BUCKET=<bucket> node scripts/upload-to-s3.js
```

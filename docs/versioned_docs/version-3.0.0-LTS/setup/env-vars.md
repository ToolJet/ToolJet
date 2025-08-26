---
id: env-vars
title: Environment Variables
---

ToolJet requires several environment variables to function properly. Below is a simplified guide to setting them up.

## ToolJet Server

### Required Variables

#### ToolJet Host

- `TOOLJET_HOST`: Public URL of ToolJet (e.g., `https://app.tooljet.ai`)

#### Lockbox Configuration
- `LOCKBOX_MASTER_KEY`: 32-byte hex string for encrypting datasource credentials
  - Generate using: `openssl rand -hex 32`

#### Application Secret
- `SECRET_KEY_BASE`: 64-byte hex string for encrypting session cookies
  - Generate using: `openssl rand -hex 64`

#### Database Configuration
- `PG_HOST`: PostgreSQL database host
- `PG_DB`: Database name
- `PG_USER`: Username
- `PG_PASS`: Password
- `PG_PORT`: Port
  
**Docker Compose Setup:** If you are using a Docker Compose setup with an in-built PostgreSQL instance, set `PG_HOST` to `postgres`. This ensures that Docker's internal DNS resolves the hostname correctly, allowing the ToolJet server to connect to the database seamlessly.

**Database Connection URL:** If you intend to use the database connection URL and your database does not support SSL, use the following format when setting the `DATABASE_URL` variable:

```
DATABASE_URL=postgres://PG_USER:PG_PASS@PG_HOST:5432/PG_DB?sslmode=disable
```

Replace `username`, `password`, `hostname`, `port`, and `database_name` with your actual database details.

#### Disabling Automatic Database & Extension Creation (Optional)
- `PG_DB_OWNER=false`: ToolJet by default tries to create database based on `PG_DB` variable set and additionally my try to create postgres extensions. This requires the postgres user to have `CREATEDB` permission. If this cannot be granted you can disable this behaviour by setting `PG_DB_OWNER` as `false` and will have to manually run them.

#### ToolJet Database
- `TOOLJET_DB`: Default database name (`tooljet_db`)
- `TOOLJET_DB_HOST`: Database host
- `TOOLJET_DB_USER`: Database username
- `TOOLJET_DB_PASS`: Database password
- `TOOLJET_DB_PORT`: Database port

**Automatic Database Creation:** The database name specified in `TOOLJET_DB` will be automatically created during the server boot process in all production deployment setups.

#### PostgREST
ToolJet uses **PostgREST (v12.2.0)** for API access. The following environment variables are required for PostgREST:

- `PGRST_JWT_SECRET`: JWT secret (Generate using `openssl rand -hex 32`). If this parameter is not specified, PostgREST will refuse authentication requests.
- `PGRST_DB_URI`: Database connection string
- `PGRST_LOG_LEVEL=info`

If you intent to make changes in the above configuration. Please refer [PostgREST configuration docs](https://postgrest.org/en/stable/configuration.html#environment-variables).

#### Configuring PGRST_DB_URI

`PGRST_DB_URI` is required for PostgREST, which is responsible for exposing the database as a REST API. It must be explicitly set to ensure proper functionality.

This follows the format:

```
PGRST_DB_URI=postgres://TOOLJET_DB_USER:TOOLJET_DB_PASS@TOOLJET_DB_HOST:5432/TOOLJET_DB
```

Ensure that:

- `username` and `password` match the credentials for the PostgREST database user.
- `hostname` is correctly set (`postgres` if using Docker Compose setup with an in-built PostgreSQL).
- `port` is the PostgreSQL port (default: `5432`).
- `database_name` is the database used for PostgREST (`tooljet_db` in this example).

#### Redis Configuration

Include the following Redis environment variables within the ToolJet deployment only if you are connecting to an external **Redis instance (v6.2)** for a multi-service or multi-pod setup and have followed the necessary steps to create Redis.

```
REDIS_HOST=
REDIS_PORT=
REDIS_USER=
REDIS_PASSWORD=
```

### Optional Configurations

#### Comments Feature

- `COMMENT_FEATURE_ENABLE=true/false`: Use this environment variable to enable/disable the feature that allows you to add comments on the canvas. To configure this environment variable, ensure that multiplayer editing is enabled in the Settings.

#### User Session Expiry
- `USER_SESSION_EXPIRY`: Controls session expiry time (in minutes). Default: **10 days**.

Note: The variable expects the value in minutes. ex: USER_SESSION_EXPIRY = 120 which is 2 hours

#### Password Retry Limit
By default, an account is locked after 5 failed login attempts. You can control this with:  

- `DISABLE_PASSWORD_RETRY_LIMIT=true`: Disables the retry limit.  
- `PASSWORD_RETRY_LIMIT=<number>`: Sets a custom retry limit (default is 5).

#### Hide Account Setup Link

- `HIDE_ACCOUNT_SETUP_LINK`: Set to `true` to hide the account setup link from the admin in the manage user page. Ensure SMTP is configured to send welcome emails.

#### Restrict Signups  
Set `DISABLE_SIGNUPS=true` to allow only invited users to sign up. The signup page will still be visible but unusable.

#### Serving the Client  
- `SERVE_CLIENT=false`: Stops the backend from serving the frontend.

#### SMTP Configuration
ToolJet sends emails via SMTP. 

:::info
If you have upgraded from a version prior to v2.62.0, the SMTP variables in your .env file will automatically be mapped to the UI. For versions v2.62.0 and later, SMTP configuration will no longer be picked up from the .env file for Enterprise Edition. You must configure SMTP through the UI. You can safely remove these variables from your .env file after ensuring that the configuration is properly set up in the UI.
:::

For **Enterprise Edition**, configure SMTP in the ToolJet Settings UI.

For **Community Edition**, use these environment variables:

- `DEFAULT_FROM_EMAIL`: Sender email address
- `SMTP_USERNAME`: SMTP username
- `SMTP_PASSWORD`: SMTP password
- `SMTP_DOMAIN`: SMTP host
- `SMTP_PORT`: SMTP port

#### Custom CA Certificate
If ToolJet needs to connect to self-signed HTTPS endpoints, ensure the `NODE_EXTRA_CA_CERTS` environment variable is set to the absolute path of the CA certificate file.

- `NODE_EXTRA_CA_CERTS=/path/to/cert.pem`: Absolute path to the PEM file (can contain multiple certificates).

### Third-Party Integrations

#### Slack
To use Slack as a data source in ToolJet, create a Slack app and set:

- `SLACK_CLIENT_ID`: Slack app client ID
- `SLACK_CLIENT_SECRET`: Slack app client secret

#### Google OAuth
To connect ToolJet with Google services like Google Sheets, create OAuth credentials in Google Cloud Console.

- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret

#### Google Maps API
To use the Maps widget in ToolJet, create a Google Maps API key and set:

- `GOOGLE_MAPS_API_KEY`: Google Maps API key

#### Application Monitoring (APM)
- `APM_VENDOR=sentry`: Set APM vendor.
- `SENTRY_DNS`: Sentry project DSN.
- `SENTRY_DEBUG=true/false`: Enable/disable Sentry debugging.

#### Security & Authentication
By default, ToolJet sends user count updates every 24 hours. To disable this, use:

- `DISABLE_TOOLJET_TELEMETRY=true`: Disables telemetry.(Enabled by default)

#### Single Sign-On (SSO)
Enable Google or GitHub SSO with these environment variables:

**Google SSO:**
- `SSO_GOOGLE_OAUTH2_CLIENT_ID`: Google OAuth client ID

**GitHub SSO:**
- `SSO_GIT_OAUTH2_CLIENT_ID`: GitHub OAuth client ID
- `SSO_GIT_OAUTH2_CLIENT_SECRET`: GitHub OAuth client secret
- `SSO_GIT_OAUTH2_HOST`: GitHub host if self-hosted

**General SSO Settings:**
- `SSO_ACCEPTED_DOMAINS`: Comma-separated list of allowed email domains
- `SSO_DISABLE_SIGNUPS=true`: Restricts signups to existing users

#### REST API Cookie Forwarding
By default, ToolJet does not forward cookies with REST API requests. To enable this (self-hosted only), set:

- `FORWARD_RESTAPI_COOKIES=true`: Allows forwarding cookies with REST API requests.

#### Asset Path

This is required when the assets for the client are to be loaded from elsewhere (eg: CDN). This can be an absolute path, or relative to main HTML file.

- `ASSET_PATH`: Path for loading frontend assets (e.g., `https://app.tooljet.ai/`)

## Additional Configurations

#### Log File Path
- `LOG_FILE_PATH`: Path to store audit logs (e.g., `tooljet/log/tooljet-audit.log`)

#### Embedding Private Apps
By default, only public apps can be embedded. To allow embedding of private ToolJet apps, set:

- `ENABLE_PRIVATE_APP_EMBED=true/false`: Allows embedding of private ToolJet apps.

**Note: Available in ToolJet Enterprise 2.8.0+ and Community/Cloud 2.10.0+.**

#### Default Language
Set the default language using the `LANGUAGE` variable. Supported options:


<div style={{ display: 'flex' }} >

<div style = {{ width:'40%' }} >

| Language    | Code | Native Name       |
|-------------|------|-------------------|
| English     | en   | English           |
| French      | fr   | Français          |
| Spanish     | es   | Español           |
| Italian     | it   | Italiano          |

</div>

<div style = {{ width:'5%' }} > </div>

<div style = {{ width:'50%' }} >

| Language    | Code | Native Name       |
|-------------|------|-------------------|
| Indonesian  | id   | Bahasa Indonesia  |
| Ukrainian   | uk   | Українська        |
| Russian     | ru   | Русский           |
| German      | de   | Deutsch           |

</div>

</div>

Example: `LANGUAGE=fr` (for French).

**Note:** This setting is not available in ToolJet Cloud.
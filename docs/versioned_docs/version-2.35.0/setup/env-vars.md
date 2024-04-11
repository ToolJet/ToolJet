---
id: env-vars
title: Environment variables
---

# Environment variables

Both the ToolJet server and client requires some environment variables to start running.

*If you have any questions feel free to join our [Slack Community](https://tooljet.com/slack) or send us an email at hello@tooljet.com.*

## ToolJet server

### ToolJet host ( required )

| variable     | description                                                      |
| ------------ | ---------------------------------------------------------------- |
| TOOLJET_HOST | the public URL of ToolJet client ( eg: https://app.tooljet.com ) |

### Lockbox configuration ( required )

ToolJet server uses lockbox to encrypt datasource credentials. You should set the environment variable `LOCKBOX_MASTER_KEY` with a 32 byte hexadecimal string.

### Application Secret ( required )

ToolJet server uses a secure 64 byte hexadecimal string to encrypt session cookies. You should set the environment variable `SECRET_KEY_BASE`.

:::tip
If you have `openssl` installed, you can run the following commands to generate the value for `LOCKBOX_MASTER_KEY` and `SECRET_KEY_BASE`.

For `LOCKBOX_MASTER_KEY` use `openssl rand -hex 32`
For `SECRET_KEY_BASE` use `openssl rand -hex 64`
:::

### Database configuration ( required )

ToolJet server uses PostgreSQL as the database.

| variable | description            |
| -------- | ---------------------- |
| PG_HOST  | postgres database host |
| PG_DB    | name of the database   |
| PG_USER  | username               |
| PG_PASS  | password               |
| PG_PORT  | port                   |

:::tip
If you are using docker-compose setup, you can set PG_HOST as `postgres` which will be DNS resolved by docker
:::

:::info
If you intent you use the DB connection url and if the connection does not support ssl. Please use the below format using the variable DATABASE_URL.
`postgres://username:password@hostname:port/database_name?sslmode=disable`
:::

### Disable database and extension creation (optional)

ToolJet by default tries to create database based on `PG_DB` variable set and additionally my try to create postgres extensions. This requires the postgres user to have CREATEDB permission. If this cannot be granted you can disable this behaviour by setting `PG_DB_OWNER` as `false` and will have to manually run them.

### Check for updates ( optional )

Self-hosted version of ToolJet pings our server to fetch the latest product updates every 24 hours. You can disable this by setting the value of `CHECK_FOR_UPDATES` environment variable to `0`. This feature is enabled by default.

### Comment feature enable ( optional )

Use this environment variable to enable/disable the feature that allows you to add comments on the canvas. To configure this environment variable, ensure that multiplayer editing is enabled in the Settings.

| variable               | value             |
| ---------------------- | ----------------- |
| COMMENT_FEATURE_ENABLE | `true` or `false` |

### Marketplace
#### Marketplace feature enable ( optional )

Use this environment variable to enable/disable the feature that allows users to use the marketplace.

| variable                   | value             |
| -------------------------- | ----------------- |
| ENABLE_MARKETPLACE_FEATURE | `true` or `false` |

#### Enable Marketplace plugin developement mode ( optional )

Use this environment variable to enable/disable the developement mode that allows developers to build the plugin.

| variable                   | value             |
| -------------------------- | ----------------- |
| ENABLE_MARKETPLACE_DEV_MODE | `true` or `false` |

### User Session Expiry Time (Optional)

| variable         | description                                     |
| ---------------- | ----------------------------------------------- |
| USER_SESSION_EXPIRY | This variable controls the user session expiry time. By default, the session expires after **10** days. The variable expects the value in minutes. ex: USER_SESSION_EXPIRY = 120 which is 2 hours |

### Enable ToolJet Database ( optional )

| variable          | description                                  |
| ----------------- | -------------------------------------------- |
| ENABLE_TOOLJET_DB | `true` or `false`                            |
| TOOLJET_DB        | Default value is `tooljet_db`                |
| TOOLJET_DB_HOST   | database host                                |
| TOOLJET_DB_USER   | database username                            |
| TOOLJET_DB_PASS   | database password                            |
| TOOLJET_DB_PORT   | database port                                |
| PGRST_JWT_SECRET  | JWT token client provided for authentication |
| PGRST_HOST        | postgrest database host                      |

Use `ENABLE_TOOLJET_DB` to enable/disable the feature that allows users to work with inbuilt data store to build apps with. Inorder to set it up, [follow the instructions here](/docs/tooljet-database#enabling-the-tooljet-database-for-your-instance).

:::tip
When this feature is enabled, the database name provided for `TOOLJET_DB` will be utilized to create a new database during server boot process in all of our production deploy setups.
Incase you want to trigger it manually, use the command `npm run db:create` on ToolJet server.
:::

:::info
If you intent you use the DB connection url and if the connection does not support ssl. Please use the below format using the variable TOOLJET_DB_URL.
`postgres://username:password@hostname:port/database_name?sslmode=disable`
:::

### Server Host ( optional )

You can specify a different server for backend if it is hosted on another server.

| variable    | value                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------- |
| SERVER_HOST | Configure a hostname for the server as a proxy pass. If no value is set, it defaults to `server`. |

### Hide account setup link

If you want to hide account setup link from admin in manage user page, set the environment variable `HIDE_ACCOUNT_SETUP_LINK` to `true`, please make sure you have configured SMTP to receive welcome mail for users.

### Disabling signups ( optional )

If you want to restrict the signups and allow new users only by invitations, set the environment variable `DISABLE_SIGNUPS` to `true`.

:::tip
You will still be able to see the signup page but won't be able to successfully submit the form.
:::

### Serve client as a server end-point ( optional )

By default, the `SERVE_CLIENT` variable will be unset and the server will serve the client at its `/` end-point.
You can set `SERVE_CLIENT` to `false` to disable this behaviour.

### Serve client at subpath

If ToolJet is hosted on a domain subpath, you can set the environment variable `SUB_PATH` to support it.
Please note the subpath is to be set with trailing `/` and is applicable only when the server is serving the frontend client.

### SMTP configuration ( optional )

ToolJet uses SMTP services to send emails ( Eg: invitation email when you add new users to your workspace ).

| variable           | description                               |
| ------------------ | ----------------------------------------- |
| DEFAULT_FROM_EMAIL | from email for the email fired by ToolJet |
| SMTP_USERNAME      | username                                  |
| SMTP_PASSWORD      | password                                  |
| SMTP_DOMAIN        | domain or host                            |
| SMTP_PORT          | port                                      |

### Slack configuration ( optional )

If your ToolJet installation requires Slack as a data source, you need to create a Slack app and set the following environment variables:

| variable            | description                    |
| ------------------- | ------------------------------ |
| SLACK_CLIENT_ID     | client id of the slack app     |
| SLACK_CLIENT_SECRET | client secret of the slack app |

### Google OAuth ( optional )

If your ToolJet installation needs access to data sources such as Google sheets, you need to create OAuth credentials from Google Cloud Console.

| variable             | description   |
| -------------------- | ------------- |
| GOOGLE_CLIENT_ID     | client id     |
| GOOGLE_CLIENT_SECRET | client secret |

### Google maps configuration ( optional )

If your ToolJet installation requires `Maps` widget, you need to create an API key for Google Maps API.

| variable            | description         |
| ------------------- | ------------------- |
| GOOGLE_MAPS_API_KEY | Google maps API key |

### APM VENDOR ( optional )

Specify application monitoring vendor. Currently supported values - `sentry`.

| variable   | description                               |
| ---------- | ----------------------------------------- |
| APM_VENDOR | Application performance monitoring vendor |

### SENTRY DNS ( optional )

| variable   | description                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------- |
| SENTRY_DNS | DSN tells a Sentry SDK where to send events so the events are associated with the correct project |

### SENTRY DEBUG ( optional )

Prints logs for sentry.

| variable     | description                                 |
| ------------ | ------------------------------------------- |
| SENTRY_DEBUG | `true` or `false`. Default value is `false` |

### Server URL ( optional)

This is used to set up for CSP headers and put trace info to be used with APM vendors.

| variable           | description                                                  |
| ------------------ | ------------------------------------------------------------ |
| TOOLJET_SERVER_URL | the URL of ToolJet server ( eg: https://server.tooljet.com ) |

### RELEASE VERSION ( optional)

Once set any APM provider that supports segregation with releases will track it.

### NODE_EXTRA_CA_CERTS (optional)

Tooljet needs to be configured for custom CA certificate to be able to trust and establish connection over https. This requires you to configure an additional env var `NODE_EXTRA_CA_CERTS` to have absolute path to your CA certificates. This file named `cert.pem` needs to be in PEM format and can have more than one certificates.

| variable            | description                                                        |
| ------------------- | ------------------------------------------------------------------ |
| NODE_EXTRA_CA_CERTS | absolute path to certificate PEM file ( eg: /ToolJet/ca/cert.pem ) |

### Disable telemetry ( optional )

Pings our server to update the total user count every 24 hours. You can disable this by setting the value of `DISABLE_TOOLJET_TELEMETRY` environment variable to `true`. This feature is enabled by default.

### Password Retry Limit (Optional)

The maximum retry limit of login password for a user is by default set to 5, account will be locked after 5 unsuccessful login attempts. Use the variables mentioned below to control this behavior:

| variable                     | description                                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| DISABLE_PASSWORD_RETRY_LIMIT | (true/false) To disable the password retry check, if value is `true` then no limits for password retry |
| PASSWORD_RETRY_LIMIT         | To change the default password retry limit (5)                                                         |

### SSO Configurations (Optional)

Configurations for instance level SSO.

| variable                     | description                                                    |
| ---------------------------- | -------------------------------------------------------------- |
| SSO_GOOGLE_OAUTH2_CLIENT_ID  | Google OAuth client id                                         |
| SSO_GIT_OAUTH2_CLIENT_ID     | GitHub OAuth client id                                         |
| SSO_GIT_OAUTH2_CLIENT_SECRET | GitHub OAuth client secret                                     |
| SSO_GIT_OAUTH2_HOST          | GitHub OAuth host name if GitHub is self hosted                |
| SSO_ACCEPTED_DOMAINS         | comma separated email domains that supports SSO authentication |
| SSO_DISABLE_SIGNUPS          | Disable user sign up if authenticated user does not exist      |

## ToolJet client

### Server URL ( optionally required )

This is required when client is built separately.

| variable           | description                                                  |
| ------------------ | ------------------------------------------------------------ |
| TOOLJET_SERVER_URL | the URL of ToolJet server ( eg: https://server.tooljet.com ) |

### Server Port ( optional)

This could be used to for local development, it will set the server url like so: `http://localhost:<TOOLJET_SERVER_PORT>`

| variable            | description                             |
| ------------------- | --------------------------------------- |
| TOOLJET_SERVER_PORT | the port of ToolJet server ( eg: 3000 ) |

### Asset path ( optionally required )

This is required when the assets for the client are to be loaded from elsewhere (eg: CDN).
This can be an absolute path, or relative to main HTML file.

| variable   | description                                                    |
| ---------- | -------------------------------------------------------------- |
| ASSET_PATH | the asset path for the website ( eg: https://app.tooljet.com/) |

### Serve client as a server end-point ( optional )

By default the client build will be done to be served with ToolJet server.
If you intend to use client separately then can set `SERVE_CLIENT` to `false`.

## PostgREST server (Optional)

| variable         | description                                     |
| ---------------- | ----------------------------------------------- |
| PGRST_JWT_SECRET | JWT token client provided for authentication    |
| PGRST_DB_URI     | database connection string for tooljet database |
| PGRST_LOG_LEVEL  | `info`                                          |

If you intent to make changes in the above configuration. Please refer [PostgREST configuration docs](https://postgrest.org/en/stable/configuration.html#environment-variables).

:::tip
If you have openssl installed, you can run the following command `openssl rand -hex 32` to generate the value for `PGRST_JWT_SECRET`.

If this parameter is not specified then PostgREST refuses authentication requests.
:::

:::info
Please make sure that DB_URI is given in the format `postgrest://[USERNAME]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]`
:::

## Log file path ( Optional )

If a log file path is specified in environment variables, a log file containing all the data from audit logs will be created at the specified path. The file will be updated every time a new audit log is created.

| Variable | Description                                                                 |
| -------- | --------------------------------------------------------------------------- |
| LOG_FILE_PATH | the path where the log file will be created ( eg: tooljet/log/tooljet-audit.log) |

## ToolJet Apps

### Enabling embedding of private apps

By default, only embedding of public apps is permitted. By setting this variable, users will be able to embed private ToolJet Apps.

| Variable        | Description                           |
| --------------- | ------------------------------------- |
| ENABLE_PRIVATE_APP_EMBED | `true` or `false` |

:::caution
The option is only available starting from ToolJet Enterprise Edition `2.8.0` or higher, and `2.10.0` for the Community edition and cloud version.
:::

## Configuring the Default Language
To change the default language, set the LANGUAGE variable to your desired language code. 

| Variable        | Description                           |
| --------------- | ------------------------------------- |
| LANGUAGE | `LANGUAGE_CODE` |

Available Languages with their codes and native names:

| Language    | Code | Native Name       |
|-------------|------|-------------------|
| English     | en   | English           |
| French      | fr   | Français          |
| Spanish     | es   | Español           |
| Italian     | it   | Italiano          |
| Indonesian  | id   | Bahasa Indonesia  |
| Ukrainian   | uk   | Українська        |
| Russian     | ru   | Русский           |
| German      | de   | Deutsch           |

For instance, to set the language to French, you can set the LANGUAGE variable to `fr`. 

:::info
The option to set a default language is not available on cloud version of ToolJet.
:::

---
id: env-vars
title: Environment variables
---

# Environment variables

Both the ToolJet server and client requires some environment variables to start running.

## ToolJet server

#### ToolJet host ( required )

| variable     | description                                                     |
| ------------ | --------------------------------------------------------------- |
| TOOLJET_HOST | the public URL of ToolJet client ( eg: https://app.tooljet.com ) |

#### Lockbox configuration ( required )

ToolJet server uses lockbox to encrypt datasource credentials. You should set the environment variable `LOCKBOX_MASTER_KEY` with a 32 byte hexadecimal string.

#### Application Secret ( required )

ToolJet server uses a secure 64 byte hexadecimal string to encrypt session cookies. You should set the environment variable `SECRET_KEY_BASE`.

:::tip
If you have `openssl` installed, you can run the following commands to generate the value for `LOCKBOX_MASTER_KEY` and `SECRET_KEY_BASE`.

For `LOCKBOX_MASTER_KEY` use `openssl rand -hex 32`
For `SECRET_KEY_BASE` use `openssl rand -hex 64`
:::

#### Database configuration ( required )

ToolJet server uses PostgreSQL as the database.

| variable | description            |
| -------- | ---------------------- |
| PG_HOST  | postgres database host |
| PG_DB    | name of the database   |
| PG_USER  | username               |
| PG_PASS  | password               |

:::tip
If you are using docker-compose setup, you can set PG_HOST as `postgres` which will be DNS resolved by docker
:::

#### Check for updates ( optional )

Self-hosted version of ToolJet pings our server to fetch the latest product updates every 24 hours. You can disable this by setting the value of `CHECK_FOR_UPDATES` environment variable to `0`. This feature is enabled by default.

#### Comment feature enable ( optional )

Use this environment variable to enable/disable the feature that allows you to add comments on the canvas.

| variable | value            |
| -------- | ---------------------- |
| COMMENT_FEATURE_ENABLE  | `true` or `false` |

#### Multiplayer feature enable ( optional )

Use this environment variable to enable/disable the feature that allows users to collaboratively work on the canvas.

| variable | value            |
| -------- | ---------------------- |
| ENABLE_MULTIPLAYER_EDITING  | `true` or `false` |

#### Server Host ( optional )

You can specify a different server for backend if it is hosted on another server.

| variable | value            |
| -------- | ---------------------- |
| SERVER_HOST  | Configure a hostname for the server as a proxy pass. If no value is set, it defaults to `server`. |

#### Disable Multi-Workspace ( optional )

If you want to disable Multi-Workspace feature, set the environment variable `DISABLE_MULTI_WORKSPACE` to `true`.

### Hide account setup link

If you want to hide account setup link from admin in manage user page, set the environment variable `HIDE_ACCOUNT_SETUP_LINK` to `true`, please make sure you have configured SMTP to receive welcome mail for users. Valid only if `DISABLE_MULTI_WORKSPACE` is not `true`.

#### Disabling signups ( optional )

Sign up is enabled only if Multi-Workspace is enabled. If you want to restrict the signups and allow new users only by invitations, set the environment variable `DISABLE_SIGNUPS` to `true`.

:::tip
You will still be able to see the signup page but won't be able to successfully submit the form.
:::

#### Serve client as a server end-point ( optional )

By default, the `SERVE_CLIENT` variable will be set to `false` and the server won't serve the client at its `/` end-point.
You can set `SERVE_CLIENT` to `true` and the server will attempt to serve the client at its root end-point (`/`).

#### SMTP configuration ( optional )

ToolJet uses SMTP services to send emails ( Eg: invitation email when you add new users to your workspace ).

| variable           | description                               |
| ------------------ | ----------------------------------------- |
| DEFAULT_FROM_EMAIL | from email for the email fired by ToolJet |
| SMTP_USERNAME      | username                                  |
| SMTP_PASSWORD      | password                                  |
| SMTP_DOMAIN        | domain or host                            |
| SMTP_PORT          | port                                      |

#### Slack configuration ( optional )

If your ToolJet installation requires Slack as a data source, you need to create a Slack app and set the following environment variables:

| variable            | description                    |
| ------------------- | ------------------------------ |
| SLACK_CLIENT_ID     | client id of the slack app     |
| SLACK_CLIENT_SECRET | client secret of the slack app |

#### Google OAuth ( optional )

If your ToolJet installation needs access to data sources such as Google sheets, you need to create OAuth credentials from Google Cloud Console.

| variable             | description   |
| -------------------- | ------------- |
| GOOGLE_CLIENT_ID     | client id     |
| GOOGLE_CLIENT_SECRET | client secret |

#### Google maps configuration ( optional )

If your ToolJet installation requires `Maps` widget, you need to create an API key for Google Maps API.

| variable            | description         |
| ------------------- | ------------------- |
| GOOGLE_MAPS_API_KEY | Google maps API key |

#### APM VENDOR ( optional )

Specify application monitoring vendor. Currently supported values - `sentry`.

| variable   | description                               |
| ---------- | ----------------------------------------- |
| APM_VENDOR | Application performance monitoring vendor |

#### SENTRY DNS ( optional )

| variable   | description                               |
| ---------- | ----------------------------------------- |
| SENTRY_DNS |  DSN tells a Sentry SDK where to send events so the events are associated with the correct project  |

#### SENTRY DEBUG ( optional )

Prints logs for sentry.

| variable   | description                               |
| ---------- | ----------------------------------------- |
| SENTRY_DEBUG | `true` or `false`. Default value is `false` |

#### Server URL ( optional)

This is used to set up for CSP headers and put trace info to be used with APM vendors.

| variable           | description                                                 |
| ------------------ | ----------------------------------------------------------- |
| TOOLJET_SERVER_URL | the URL of ToolJet server ( eg: https://server.tooljet.com ) |

#### RELEASE VERSION ( optional)

Once set any APM provider that supports segregation with releases will track it.

#### NODE_EXTRA_CA_CERTS (optional)

Tooljet needs to be configured for custom CA certificate to be able to trust and establish connection over https. This requires you to configure an additional env var `NODE_EXTRA_CA_CERTS` to have absolute path to your CA certificates. This file named `cert.pem` needs to be in PEM format and can have more than one certificates.

| variable            | description                                                       |
| ------------------  | ----------------------------------------------------------------- |
| NODE_EXTRA_CA_CERTS | absolute path to certifcate PEM file ( eg: /ToolJet/ca/cert.pem ) |


#### Disable telemetry ( optional )

Pings our server to update the total user count every 24 hours. You can disable this by setting the value of `DISABLE_TOOLJET_TELEMETRY` environment variable to `true`. This feature is enabled by default.

## ToolJet client

#### Server URL ( optionally required )

This is required when client is built separately.

| variable           | description                                                 |
| ------------------ | ----------------------------------------------------------- |
| TOOLJET_SERVER_URL | the URL of ToolJet server ( eg: https://server.tooljet.com ) |


#### Server Port ( optional)

This could be used to for local development, it will set the server url like so: `http://localhost:<TOOLJET_SERVER_PORT>`

| variable            | description                             |
|---------------------|-----------------------------------------|
| TOOLJET_SERVER_PORT | the port of ToolJet server ( eg: 3000 ) |


#### Asset path ( optionally required )

This is required when the assets for the client are to be loaded from elsewhere (eg: CDN).
This can be an absolute path, or relative to main HTML file.

| variable           | description                                                   |
| ------------------ | -----------------------------------------------------------   |
| ASSET_PATH         | the asset path for the website ( eg: https://app.tooljet.com/) |

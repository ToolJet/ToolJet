---
sidebar_position: 8
---

# Environment variables

Both the ToolJet server and client requires some environment variables to start running.

## ToolJet server

#### ToolJet host ( required )

| variable     | description                                                     |
| ------------ | --------------------------------------------------------------- |
| TOOLJET_HOST | the public URL of ToolJet client ( eg: https://app.tooljet.io ) |

#### Database configuration ( required )

ToolJet server uses PostgreSQL as the database.

| variable | description            |
| -------- | ---------------------- |
| PG_HOST  | postgres database host |
| PG_DB    | name of the database   |
| PG_USER  | username               |
| PG_PASS  | password               |

#### Lockbox configuration ( required )

ToolJet server uses lockbox to encrypt datasource credentials. You should set the environment variable `LOCKBOX_MASTER_KEY` with a 32 byte hexadecimal string.

#### Application Secret ( required )

ToolJet server uses a secure 64 byte hexadecimal string to encrypt session cookies. You should set the environment variable `SECRET_KEY_BASE`.

:::tip
If you have `openssl` installed, you can run the following commands to generate the the value for `LOCKBOX_MASTER_KEY` and `SECRET_KEY_BASE`.

For `LOCKBOX_MASTER_KEY` use `openssl rand -hex 32`
For `SECRET_KEY_BASE` use `openssl rand -hex 64`
:::

#### Disabling signups ( optional )

If want to restrict the signups and allow new users only by invitations, set the environment variable `DISABLE_SIGNUPS` to `true`.

:::tip
You will still be able to see the signup page but won't be able to successfully submit the form.
:::

#### Serve client as a server end-point ( optional )

By default, the `SERVE_CLIENT` variable will be set to `false` and the server won't serve the client at its `/` end-point.
You can set `SERVE_CLIENT` to `true` and the server will attempt to serve the client at its root end-point (`/`).

#### SMTP configuration ( optional )

ToolJet uses SMTP services to send emails ( Eg: invitation email when you add new users to your organization ).

| variable           | description                               |
| ------------------ | ----------------------------------------- |
| DEFAULT_FROM_EMAIL | from email for the email fired by ToolJet |
| SMTP_USERNAME      | username                                  |
| SMTP_PASSWORD      | password                                  |
| SMTP_DOMAIN        | domain or host                            |
| SMTP_PORT          | port                                      |

#### Slack configuration ( optional )

If your ToolJet installation requires Slack as a datasource, you need to create a Slack app and set the following environment variables:

| variable            | description                    |
| ------------------- | ------------------------------ |
| SLACK_CLIENT_ID     | client id of the slack app     |
| SLACK_CLIENT_SECRET | client secret of the slack app |

#### Google OAuth ( optional )

If your ToolJet installation needs access to datasources such as Google sheets, you need to create OAuth credentials from Google Cloud Console.

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
| APM VENDOR | Application performance monitoring vendor |

#### SENTRY DNS ( optional )

DSN tells a Sentry SDK where to send events so the events are associated with the correct project

#### SENTRY DEBUG ( optional )

Prints logs for sentry. Supported values: `true` | `false`
Default value is `false`

#### Server URL ( optional)

This is used to set up for CSP headers and put trace info to be used with APM vendors.

| variable           | description                                                 |
| ------------------ | ----------------------------------------------------------- |
| TOOLJET_SERVER_URL | the URL of ToolJet server ( eg: https://server.tooljet.io ) |

#### RELEASE VERSION ( optional)

Once set any APM provider that supports segregation with releases will track it.

## ToolJet client

#### Server URL ( optionally required )

This is required when client is built separately.

| variable           | description                                                 |
| ------------------ | ----------------------------------------------------------- |
| TOOLJET_SERVER_URL | the URL of ToolJet server ( eg: https://server.tooljet.io ) |


#### Asset path ( optionally required )

This is required when the assets for the client are to be loaded from elsewhere (eg: CDN).
This can be an absolute path, or relative to main HTML file.

| variable           | description                                                   |
| ------------------ | -----------------------------------------------------------   |
| ASSET_PATH         | the asset path for the website ( eg: https://app.tooljet.io/) |

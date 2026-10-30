---
id: env-vars
title: Environment Variables
slug: /setup/env-vars/
---

ToolJet requires several environment variables to function properly. Below is a simplified guide to setting them up.

## ToolJet Server

### Required Variables

#### ToolJet Host

- `TOOLJET_HOST`: Public URL of ToolJet (e.g., `https://app.tooljet.com`)

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
- `TOOLJET_DB_BULK_UPLOAD_MAX_ROWS`: Maximum number of rows allowed in bulk upload (default: 5000)
- `TOOLJET_DB_BULK_UPLOAD_MAX_CSV_FILE_SIZE_MB`: Maximum file size of CSV for bulk upload. Default value is 5 MB

#### Why ToolJet Requires Two Databases

ToolJet requires two separate databases for optimal functionality. **TOOLJET_DB** is used to store the platform's internal metadata, including tables created within ToolJet. On the other hand, **PG_DB** acts as the primary database for application data, handling end-user data managed by the apps built on ToolJet.

**Automatic Database Creation:** The database name specified in `TOOLJET_DB` will be automatically created during the server boot process in all production deployment setups.

#### PostgreSQL SSL Mode

- `PGSSLMODE`: Standard PostgreSQL SSL mode. Set it to `require` when your PostgreSQL server accepts only SSL connections, as managed services such as Amazon RDS and Azure Database for PostgreSQL usually do. No default.

With `PGSSLMODE=require`, the **Sample data source** is also created with SSL turned on. ToolJet checks for the exact value `require`; other modes such as `verify-full` leave SSL off for the sample data source.

#### Sample Database

When the server starts, ToolJet creates a PostgreSQL database named `sample_db` and fills it with demo tables. Each new workspace gets a **Sample data source** that connects to it. The demo tables are dropped and recreated every time the server starts, so don't store your own data in `sample_db`.

By default, `sample_db` is created on the same PostgreSQL server as `PG_DB`, with the same credentials. To host it elsewhere, set:

- `SAMPLE_PG_DB_HOST`: Host of the PostgreSQL server for `sample_db`. Default: `PG_HOST`.
- `SAMPLE_PG_DB_PORT`: Port. Default: `PG_PORT`.
- `SAMPLE_PG_DB_USER`: Username. This user needs permission to create databases. Default: `PG_USER`.
- `SAMPLE_PG_DB_PASS`: Password. Default: `PG_PASS`.

These variables are ignored when you set `DATABASE_URL`. `sample_db` then uses the connection details from `DATABASE_URL`. Changes apply to workspaces created afterward; existing **Sample data source** connections keep the values they were created with.

If `PG_DB_OWNER=false`, ToolJet doesn't create or fill `sample_db`, so the **Sample data source** can't connect.

#### PostgREST

ToolJet uses **PostgREST (v12.2.0)** for API access. The ToolJet server reads two of these variables:

- `PGRST_HOST`: Address of PostgREST, for example `localhost:3001` or `postgrest:3000`. A missing `http://` or `https://` prefix is added for you. Default: `http://localhost:3001`.
- `PGRST_JWT_SECRET`: Secret ToolJet uses to sign requests to PostgREST. It must be the same value PostgREST uses.

When `PGRST_HOST` starts with `localhost:`, the ToolJet container starts PostgREST itself, using `PGRST_DB_URI` and listening on `PGRST_SERVER_PORT`. Set `PGRST_SERVER_PORT` to the port in `PGRST_HOST`. For any other value, ToolJet connects to a PostgREST service you run separately.

PostgREST itself reads the following variables, so set them wherever PostgREST runs:

- `PGRST_JWT_SECRET`: JWT secret (Generate using `openssl rand -hex 32`). If this parameter is not specified, PostgREST will refuse authentication requests.
- `PGRST_DB_URI`: Database connection string
- `PGRST_LOG_LEVEL=info`
- `PGRST_DB_PRE_CONFIG=postgrest.pre_config`

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

Include the following Redis environment variables within the ToolJet deployment only if you are connecting to an external **Redis instance (v7.x recommended)** for a multi-service or multi-pod setup, or when running workflows with separate worker containers.

**Required Variables:**

```
REDIS_HOST=
REDIS_PORT=
```

**Optional Variables:**

```
REDIS_USERNAME=              # Redis ACL username
REDIS_PASSWORD=
REDIS_DB=0                   # Redis database number (default: 0)
REDIS_TLS=false              # Enable TLS/SSL connection (set to 'true')
```

:::note
ToolJet reads the Redis username from `REDIS_USERNAME`. On Enterprise Edition, the connection used for multiplayer editing reads `REDIS_USER` instead, or `REDIS_URL` if it's set. See [Redis Connection URL](#redis-connection-url). If your Redis needs an ACL username, set both `REDIS_USERNAME` and `REDIS_USER`.
:::

:::info
**For Workflows:** When running separate worker containers or multiple instances for workflow scheduling, an external Redis instance is **required** for job queue coordination. The built-in Redis only works for single instance deployments.
:::

#### Redis Connection URL

<PlanBadge type="enterprise" />

- `REDIS_URL`: Redis connection URL, for example `rediss://user:password@redis.example.com:6380/0`. Only the real-time connection used for multiplayer editing reads it, and when it's set, that connection ignores the other Redis variables. Everything else that uses Redis, including workflow job queues, reads only the `REDIS_*` variables above, so keep them set.

The multiplayer editing connection doesn't read `REDIS_USERNAME`, `REDIS_DB`, or `REDIS_TLS`. If your Redis needs TLS or a database number other than `0`, also set `REDIS_URL`: use `rediss://` for TLS and `/<number>` for the database.

#### Workflow Scheduling

ToolJet Workflows allows you to design and execute complex, data-centric automations using a visual, node-based interface. Configure the following environment variables to enable workflow scheduling:

**Required Variables:**

- `WORKER`: Set to `true` to enable job processing for workflow scheduling. Set to `false` or leave unset for HTTP-only mode (default: `false`)

**Optional Variables:**

- `TOOLJET_WORKFLOW_CONCURRENCY`: Number of workflow jobs processed concurrently per worker instance (default: `5`)

:::warning
**External Redis Requirement**: When running separate worker containers or multiple instances, an external stateful Redis instance is **required** for job queue coordination. The built-in Redis only works when the server and worker are in the same container instance (single instance deployment).
:::

For detailed workflow configuration and deployment examples, refer to the [Workflow Migration Guide](/docs/setup/workflow-temporal-to-bullmq-migration/).

#### Workflow Webhooks and Job Dashboard

- `WEBHOOK_THROTTLE_TTL`, `WEBHOOK_THROTTLE_LIMIT`: Rate limit for incoming workflow webhook requests. See [Restrictions on Usage of Webhook Triggers](/docs/workflows/triggers/webhook#restrictions-on-usage-of-webhook-triggers).
- `DISABLE_WEBHOOKS`: Set to `true` to hide the **Triggers** panel (webhook and schedule settings) in the workflow editor. This only hides the panel: webhook URLs of existing workflows keep accepting requests.
- `TOOLJET_QUEUE_DASH_PASSWORD`: Password for the workflow job queue dashboard at `<TOOLJET_HOST>/jobs`. Sign in with the username `admin`. There's no default, and you can't sign in until you set it. Not available on ToolJet Cloud.

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

#### Invite Link Expiry

- `LINK_EXPIRY_MINUTES`: Controls how long workspace invite, forgot password, and email verification links remain valid (in minutes). Default: **1440 minutes (24 hours)**.

#### Password Expiry

- `PASSWORD_EXPIRY_DAYS`: Controls how long a password remains valid before the user is required to reset it (in days). Default: **30 days**. Set to `0` to disable password expiry.

#### Two-Factor Authentication

<PlanBadge type="enterprise" />

- `MFA_MASTER_SECRET`: Secret used to derive each user's two-factor authentication (2FA) key. Required to use [two-factor authentication](/docs/user-management/authentication/2fa). No default.
  - Use a long random value, for example one generated with `openssl rand -hex 32`.

If `MFA_MASTER_SECRET` isn't set, every 2FA request (setting up an authenticator app, entering a code at sign-in, or turning 2FA off) fails with the error `MFA_MASTER_SECRET is not configured. Set it in the environment before enabling two-factor authentication.`

:::warning
Set `MFA_MASTER_SECRET` once and keep it unchanged. Each user's 2FA key is derived from this secret, so changing it invalidates every authenticator app that's already set up. Users who had 2FA turned on then need a super admin to [reset 2FA](/docs/user-management/authentication/2fa#reset-two-factor-authentication) before they can set it up again.
:::

#### Hide Account Setup Link

- `HIDE_ACCOUNT_SETUP_LINK`: Set to `true` to hide the account setup link from the admin in the manage user page. Ensure SMTP is configured to send welcome emails.

#### Personal Access Token Expiry

<PlanBadge type="enterprise" />

Default lifetimes for tokens created with the [Personal Access Token API](/docs/user-management/authentication/self-hosted/pat). They apply only when the request leaves out `patExpiry` or `sessionExpiry`. Note the units: these variables are in **days**, while the request fields are in minutes.

- `PAT_EXPIRY`: How long a personal access token stays valid, in days. Default: **10**.
- `PAT_SESSION_EXPIRY`: How long a session opened with a personal access token stays valid, in days. Default: **10**.

#### Bulk User Upload

<PlanBadge type="enterprise" />

Limits for [bulk uploading users](/docs/user-management/onboard-users/bulk-invite-users) from a CSV file:

- `ORG_USERS_BULK_UPLOAD_MAX_FILE_SIZE_MB`: Maximum size of the CSV file, in MB. Default: **1**.
- `ORG_USERS_BULK_UPLOAD_MAX_ROWS`: Maximum number of user rows per file. Default: **250**.

Both values must be positive numbers. Any other value falls back to the default.

#### Restrict Signups

Set `DISABLE_SIGNUPS=true` to allow only invited users to sign up. The signup page will still be visible but unusable.

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
- `SMTP_DISABLED`: Set to `true` to stop ToolJet from sending emails while SMTP is configured through environment variables. Default: `false`. See [SMTP configuration](/docs/tj-setup/smtp-setup/configuration#configuration-with-environment-variables).

#### Suppress Emails to Specific Domains

- `FILTERED_DOMAINS_FOR_EMAIL`: Comma-separated email domains that ToolJet never sends email to, for example `example.com,test.local`. If any recipient of an email is in one of these domains, ToolJet skips the whole email. Enter domains in lowercase.

#### Custom CA Certificate

If ToolJet needs to connect to self-signed HTTPS endpoints, ensure the `NODE_EXTRA_CA_CERTS` environment variable is set to the absolute path of the CA certificate file.

- `NODE_EXTRA_CA_CERTS=/path/to/cert.pem`: Absolute path to the PEM file (can contain multiple certificates).

#### GitSync with Self-Signed GitHub Enterprise Certificates

<PlanBadge type="enterprise" />

- `GIT_SSL_VERIFY_DISABLED`: Set to `true` to skip TLS certificate checks when [GitSync](/docs/development-lifecycle/gitsync/connect-to-git-repo/github-config) connects to GitHub Enterprise Server over HTTPS. It applies only when both **GitHub enterprise URL** and **GitHub enterprise API URL** are configured; connections to github.com are always verified. Default: `false`.

:::warning
Skipping certificate checks exposes GitSync traffic, including access tokens, to interception. Use it only on a trusted network.
:::

#### ToolJet API Import Application

By default, server accepts maximum JSON size as 50 MB. To increase this limit, use the following environment variable:

- `MAX_JSON_SIZE = "150mb"`

#### SQL Data Source Query Timeout

- `PLUGINS_SQL_DB_STATEMENT_TIMEOUT`: Maximum time a query on a [PostgreSQL](/docs/data-sources/postgresql#query-timeout), [MySQL](/docs/data-sources/mysql#query-timeout), or [SQL Server](/docs/data-sources/mssql#query-timeout) data source can run before it's stopped, in milliseconds. Default: `120000` (2 minutes). A value that isn't a number falls back to the default.

#### Customizing Workflow Configuration

You can control workflow execution behavior using the following environment variables:

| Variable | Description | Default | Unit |
|-----------|-------------|---------|-------|
| `WORKFLOW_TIMEOUT_SECONDS` | Maximum duration a workflow execution can run before timing out. | 60 | seconds |
| `WORKFLOW_JS_MEMORY_LIMIT_MB` | Maximum memory limit allocated to each `runjs` or `loop` node during execution. | 20 | MB |
| `WORKFLOW_JS_TIMEOUT_MS` | Maximum time allowed for each `runjs` or `loop` node execution. | 100 | milliseconds |

#### Configuring Non Email Identifier for ToolJet OIDC

You can setup OIDC using non email identifier for authenticating users to ToolJet (for example, an employee ID) by setting the following environment variables.

| Variable                  | Description                                                |
| ------------------------- | ---------------------------------------------------------- |
| `SSO_UNIQUE_ID_FIELD`     | Unique identifier field name sent back by the IdP.         |
| `SSO_CUSTOM_EMAIL_DOMAIN` | Domain name that will be used to construct dummy email id. |

To learn more, refer to [this section](/docs/user-management/sso/oidc/setup#configuring-tooljet-oidc-with-non-email-identifier).

#### Configure Stronger Password Validation Rules

ToolJet allows you to enforce a stronger password complexity rule. By default, the login password should be atleast 5 characters long and any character can be used. To enforce stronger password validation, use the following environment variable:

- `ENABLE_PASSWORD_COMPLEXITY_RULES = true`

When **false**, passwords will follow the default validations. When **true**, passwords must meet all the following rules:
| Rule | Requirement |
|-----------|-------------|
| Password length | 12-24 characters |
| Uppercase letters | A-Z |
| Lowercase letters | a-z |
| Numbers | 0-9 |
| Special characters | ! @ # $ % ^ & \* ( ) \_ + - = \{ \} [ ] : ; ” ' , . ? / \ \| |

:::info
These validations apply to both the instance and workspace levels.
:::

#### Configure GitSync via Environment Variables

:::warning BETA
This feature is currently in beta and is not recommended for production use.
For full setup instructions, provider-specific keys, and Docker Compose examples, see [Configure GitSync via Environment Variables](/docs/beta/gitsync-env-vars).
:::

GitSync can be configured using environment variables instead of the ToolJet UI, useful for self-hosted setups where you want to automate or version-control your GitSync configuration.

ToolJet supports **GitHub (HTTPS)**, **GitLab**, and **Git (SSH)**. For example, to configure GitSync with GitHub (HTTPS), set the following variables:

| **Key** | **Description** |
| --- | --- |
| `GITHUB_URL` | The HTTPS URL of your GitHub repository. (e.g. `https://github.com/your-org/your-repo`) |
| `GITHUB_BRANCH` | The branch to sync with. |
| `GITHUB_APP_ID` | Your GitHub App ID. |
| `GITHUB_INSTALLATION_ID` | The installation ID for your GitHub App. |
| `GITHUB_PRIVATE_KEY` | The private key generated when creating the GitHub App. Escape newlines as `\n`. |

#### Configure License Key via Environment Variable

:::warning BETA
This feature is currently in beta and is not recommended for production use.
:::

The license key can be configured via an environment variable to avoid re-entering it through the UI on every new instance. Setting `TJ_LICENSE` ensures the license is applied automatically at startup without any manual configuration.

| **Variable** | **Description** |
|:--- |:--- |
| `TJ_LICENSE` | Your ToolJet license key. When set, the license key field on the **Settings** page is populated automatically from this variable. |

**How it works:**

- When `TJ_LICENSE` variable is set, the **Settings** page shows the license key field pre-filled with the placeholder `{{TJ_LICENSE_KEY}}`, indicating the value is sourced from the environment.
- The field will be disabled and the toggle will be switched to **Env variable** mode automatically.
- To switch back to entering the key manually via the UI, use the toggle on the **Settings** page to switch to **UI** mode.

<img className="screenshot-full img-m" src="/img/env-vars/prefilled-license-key.png" alt="Prefilled License Key" />

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
- `DEPLOYMENT_PLATFORM`: Optional label for how ToolJet is deployed, for example `docker` or `k8s:helm`. It's sent with telemetry data and doesn't change how ToolJet runs. ToolJet's deployment templates set it for you.

#### Single Sign-On (SSO)

Enable Google or GitHub SSO with these environment variables:

**Google SSO:**

- `SSO_GOOGLE_OAUTH2_CLIENT_ID`: Google OAuth client ID

**GitHub SSO:**

- `SSO_GIT_OAUTH2_CLIENT_ID`: GitHub OAuth client ID
- `SSO_GIT_OAUTH2_CLIENT_SECRET`: GitHub OAuth client secret
- `SSO_GIT_OAUTH2_HOST`: GitHub host if self-hosted

**General SSO Settings:**

- `SSO_ACCEPTED_DOMAINS`: Read only once, during the upgrade that added instance-level domain settings, to fill in **Allowed Domains**. After that, it has no effect. Manage allowed domains in the instance's [domain constraints](/docs/user-management/authentication/self-hosted/instance-login#domain-constraints).
- `SSO_DISABLE_SIGNUPS=true`: Restricts signups to existing users

#### Group Synchronization

Group sync for LDAP and SAML is turned on or off in each provider's SSO settings. The following variables are read only once, during the upgrade to 3.16, to set that toggle. After that, they have no effect:

- `DISABLE_LDAP_GROUP_SYNC=true`: Turns off group sync for LDAP when you upgrade.
- `DISABLE_SAML_GROUP_SYNC=true`: Turns off group sync for SAML when you upgrade.

See the [3.16 migration guide](/docs/setup/upgrade-to-v3.16#group-synchronization-migration-only).

#### REST API Cookie Forwarding

By default, ToolJet does not forward cookies with REST API requests. To enable this (self-hosted only), set:

- `FORWARD_RESTAPI_COOKIES=true`: Allows forwarding cookies with REST API requests.

#### SSRF Protection

ToolJet can block data source requests to internal addresses to prevent server-side request forgery (SSRF). The checks apply to REST API, GraphQL, and OpenAPI queries (including those run in workflows), the OAuth 2.0 token requests these data sources make, and the Confluence, ServiceNow, and Salesforce marketplace plugins.

- `SSRF_PROTECTION_ENABLED`: Turns the checks on or off. On by default in the Community Edition (set `false` to turn off). Off by default in the Enterprise Edition (set `true` to turn on).
- `SSRF_DNS_RESOLUTION_CHECK`: Set to `false` to skip resolving the hostname before the request is sent (default: `true`). The resolved address is still checked when the connection opens. Turn this off if a data source hostname resolves only through `/etc/hosts`, because the check can't see those entries and blocks the request.
- `SSRF_BLOCKED_SCHEMES`: Comma-separated URL schemes to block (default: `file,gopher,dict,ftp,jar,data,javascript`). Setting it replaces the default list.

When protection is on, requests (and redirects) to these destinations are blocked:

- Loopback addresses (`127.0.0.0/8`, `::1`). The hostname `localhost` is still allowed.
- Link-local and cloud metadata addresses: `169.254.0.0/16` (including `169.254.169.254`), `fe80::/10`, `metadata.google.internal`, and `100.100.100.200`.
- Carrier-grade NAT (`100.64.0.0/10`), `0.0.0.0/8`, multicast, reserved, and broadcast addresses.
- Hostnames that only wrap an IP address, such as `*.nip.io`, `*.xip.io`, `*.sslip.io`, `*.localtest.me`, and `*.traefik.me`.

Private networks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, and IPv6 `fc00::/7`) stay reachable. There's no allowlist setting.

#### Asset Path

This is required when the assets for the client are to be loaded from elsewhere (eg: CDN). This can be an absolute path, or relative to main HTML file.

- `ASSET_PATH`: Path for loading frontend assets (e.g., `https://app.tooljet.com/`)

#### Server Port and Listen Address

- `PORT`: Port the ToolJet server listens on. Default: `3000`. The Docker Compose file sets it to `80`.
- `LISTEN_ADDR`: Network address the server binds to. Default: `::` (all interfaces). Set it to `0.0.0.0` if IPv6 is turned off on the host.

#### Serving the Frontend Separately

By default, the ToolJet server also serves the web client. Change these only if you build the frontend yourself and host it on a separate web server or CDN.

- `SERVE_CLIENT`: Set to `false` so the server serves only the API, not the web client. Any other value, or leaving it unset, keeps the client served.
- `TOOLJET_SERVER_URL`: Public URL of the ToolJet server when the frontend is hosted on a different origin, for example `https://api.yourcompany.com`. The frontend reads it when it's built, so setting it on a prebuilt ToolJet image doesn't change where the web client sends requests. On Enterprise Edition, SAML also uses it as the base of the SSO callback URL, so leave it unset when the server serves the frontend.

When the frontend runs on a different origin from the server, also set `ENABLE_CORS=true`. See [Cross-Origin Requests (CORS)](#cross-origin-requests-cors).

#### Subpath and HTTP Proxy

- `SUB_PATH`: Serves ToolJet under a path such as `/apps/tooljet/` instead of the domain root. The value must start and end with `/`. See [Deploying ToolJet on a Subpath](/docs/setup/tooljet-subpath).
- `TOOLJET_HTTP_PROXY`: Sends the server's outgoing HTTP and HTTPS requests through a proxy, for example `http://127.0.0.1:8080`. See [Connecting via HTTP Proxy](/docs/setup/http-proxy).

#### ToolJet Edition

`TOOLJET_EDITION` is already set inside each ToolJet image. Don't set or override it: it decides which edition's features the server loads and whether Enterprise licensing starts, so a wrong value can turn off licensed features.

## Additional Configurations

#### Log File Path

- `LOG_FILE_PATH`: Path to store audit logs (e.g., `tooljet/log/tooljet-audit.log`)

#### Embedding Private Apps

By default, only public apps can be embedded. To allow embedding of private ToolJet apps, set:

- `ENABLE_PRIVATE_APP_EMBED=true/false`: Allows embedding of private ToolJet apps.

**Note: Available in ToolJet Enterprise 2.8.0+ and Community/Cloud 2.10.0+.**

#### Cross-Origin Requests (CORS)

By default, the server accepts cross-origin browser requests only from `TOOLJET_HOST` and from active custom domains. Requests without an `Origin` header, such as server-to-server calls, aren't affected.

- `ENABLE_CORS`: Set to `true` to accept cross-origin requests, with credentials, from any origin. Use it only when the web client is served from a different origin than `TOOLJET_HOST`. Default: unset.

:::warning
With `ENABLE_CORS=true`, any website can send authenticated requests to ToolJet from a signed-in user's browser and read the responses. It also turns off the origin check that protects custom domains from cross-site requests.
:::

#### Content Security Policy

- `CSP_WHITELISTED_DOMAINS`: Comma-separated list of extra domains to allow in the `script-src` and `default-src` directives of ToolJet's Content Security Policy, for example `cdn.example.com,assets.example.com`. See [Whitelist CDN Domains](/docs/tj-setup/whitelist-cdn-domains).

#### Public Client Configuration

The web client loads some server environment variables from the `/api/config` endpoint, which doesn't require sign-in. By default, the endpoint returns these variables:

`TOOLJET_SERVER_URL`, `RELEASE_VERSION`, `GOOGLE_MAPS_API_KEY`, `APM_VENDOR`, `SENTRY_DNS`, `SENTRY_DEBUG`, `TOOLJET_HOST`, `SUB_PATH`, `LANGUAGE`, `ENABLE_PRIVATE_APP_EMBED`, `DISABLE_WEBHOOKS`, `HIDE_ACCOUNT_SETUP_LINK`, `ENABLE_WORKFLOW_SCHEDULING`, `SSO_HUBSPOT_PORTAL_ID`, `SSO_HUBSPOT_FORM_ID`, `ENABLE_OTEL_FRONTEND`, `OTEL_FRONTEND_FLUSH_INTERVAL_SECONDS`

- `ALLOWED_CLIENT_CONFIG_VARS`: Comma-separated list of environment variable names for the endpoint to return instead. It **replaces** the default list rather than adding to it, so include every default variable the web client still needs, such as `TOOLJET_HOST`, `SUB_PATH`, and `LANGUAGE`. Default: unset (the list above).

Instance settings, `ENABLE_WORKFLOWS_FEATURE`, and `ENABLE_MARKETPLACE_DEV_MODE` are always returned, whatever `ALLOWED_CLIENT_CONFIG_VARS` contains.

:::danger
Anyone who can reach your ToolJet URL can read every variable in this list without signing in. Never add secrets such as `SECRET_KEY_BASE`, `LOCKBOX_MASTER_KEY`, or database passwords.
:::

#### Default Language

Set the default language using the `LANGUAGE` variable. Supported options:

<div style={{ display: 'flex' }} >

<div style = {{ width:'40%' }} >

| Language | Code | Native Name |
| -------- | ---- | ----------- |
| English  | en   | English     |
| French   | fr   | Français    |
| Spanish  | es   | Español     |
| Italian  | it   | Italiano    |

</div>

<div style = {{ width:'5%' }} > </div>

<div style = {{ width:'50%' }} >

| Language   | Code | Native Name      |
| ---------- | ---- | ---------------- |
| Indonesian | id   | Bahasa Indonesia |
| Ukrainian  | uk   | Українська       |
| Russian    | ru   | Русский          |
| German     | de   | Deutsch          |

</div>

</div>

Example: `LANGUAGE=fr` (for French).

**Note:** This setting is not available in ToolJet Cloud.

#### Logging

These settings control what the ToolJet server writes to its logs. Logs go to the container output, and to the OTLP logs endpoint when [log export](#observability) is on. The defaults below apply to production deployments.

- `LOG_LEVEL`: Server log level: `trace`, `debug`, `info`, `warn`, `error`, or `fatal`. If it's unset or invalid, the level comes from `ORM_LOGGING`: `all` gives `debug`, `error` gives `error`, and anything else gives `warn`. At `warn`, only HTTP requests that return a 4xx or 5xx status are logged; set `info` to log every request.
- `ORM_LOGGING`: SQL query logging for ToolJet's internal databases. `all` logs every query with its duration and raises the default `LOG_LEVEL` to `debug`. `error` logs only failed queries. When unset, ToolJet logs failed queries and queries slower than 30 ms.
- `SLOW_QUERY_LOGGING_THRESHOLD`: Queries that take longer than this many milliseconds are logged (default: `1`, or `30` when `DISABLE_CUSTOM_QUERY_LOGGING=true`). Queries over 30 ms are logged as `SLOW QUERY` warnings. Faster ones are logged at `info` level, so you see them only when `LOG_LEVEL` is `info` or lower.
- `CUSTOM_QUERY_LOGGING_LEVEL`: Overrides `ORM_LOGGING` for query logs. `query` or `warn` logs slow and failed queries; `error` logs only failed queries.
- `QUERY_LOG_MAX_LENGTH`: Maximum number of characters of SQL text logged per query (default: `300`). Query parameter values are never logged, only how many there are.
- `DISABLE_CUSTOM_QUERY_LOGGING`: Set to `true` to use TypeORM's built-in query logger instead of ToolJet's. The built-in logger doesn't shorten query text or hide parameter values.

To mask more request or response fields in logs, set `LOGGER_REDACT`. See [Log Redaction](/docs/security/audit-logs/audit-logs#log-redaction).

#### Prometheus Metrics Endpoint

- `ENABLE_METRICS`: Set to `true` to serve Node.js process metrics (memory, CPU, event loop, garbage collection, and system load) in Prometheus format at `<TOOLJET_HOST>/api/metrics` (default: `false`). Send `Accept: application/json` to get JSON instead.

:::warning
`/api/metrics` doesn't require authentication. Restrict access to it at your load balancer or reverse proxy.
:::

#### Observability

ToolJet supports OpenTelemetry (OTEL) for comprehensive observability and monitoring. Enable metrics collection to monitor application performance, query executions, and system health.

**Basic Configuration:**

- `ENABLE_OTEL`: Set to `true` to enable OpenTelemetry traces and metrics (default: `false`). Traces and metrics are exported only by the Enterprise Edition.
- `OTEL_EXPORTER_OTLP_TRACES`: OTLP traces endpoint URL (default: `http://localhost:4318/v1/traces`)
- `OTEL_EXPORTER_OTLP_METRICS`: OTLP metrics endpoint URL (default: `http://localhost:4318/v1/metrics`)
- `SERVICE_NAME`: Value of the `service.name` attribute on exported traces, metrics, and logs (default: `tooljet`). The standard `OTEL_SERVICE_NAME` variable is also accepted, but it applies only to traces and metrics and overrides `SERVICE_NAME` there. Use `SERVICE_NAME` so all signals report the same service name.
- `SERVICE_VERSION`: Value of the `service.version` attribute on exported telemetry (default: `unknown`).
- `OTEL_HEADER`: Value of the `Authorization` header sent with trace and metric exports, for example `Basic <base64-credentials>` or `Bearer <token>` (optional). Set only the value, not `Authorization=...`. It isn't sent with log exports.
- `OTEL_EXPORTER_OTLP_HEADERS`: Additional headers sent with trace, metric, and log exports (optional, format: `key1=value1,key2=value2`). Use it for headers other than `Authorization`, such as `api-key` or `dd-api-key`, and to authenticate log exports.

**Advanced Configuration:**

- `OTEL_LOG_LEVEL`: Level of the OpenTelemetry SDK's own diagnostic messages: `none`, `error`, `warn`, `info`, `debug`, `verbose`, or `all`. `debug` also prints ToolJet's OpenTelemetry startup messages. This doesn't change application log verbosity; use `LOG_LEVEL` for that.
- `OTEL_ACTIVE_USER_WINDOW_MINUTES`: Activity window for concurrent user tracking in minutes, from `1` to `60` (default: `5`)
- `OTEL_MAX_TRACKED_USERS`: Maximum number of tracked users/sessions (default: `10000`)
- `OTEL_INCLUDE_QUERY_TEXT`: Include actual query text in metrics - **WARNING:** Creates high cardinality (default: `false`)

:::warning High Cardinality
Only enable `OTEL_INCLUDE_QUERY_TEXT=true` for debugging. This creates high cardinality metrics that can impact Prometheus performance. Use an OTEL Collector to filter this label in production.
:::

**Log Export and Browser Telemetry:**

- `OTEL_EXPORTER_OTLP_LOGS`: OTLP HTTP logs endpoint URL, for example `http://localhost:3100/otlp/v1/logs` (no default). Log export stays off until you set it. With `ENABLE_OTEL=true`, ToolJet ships its server logs here at the level set by `LOG_LEVEL`. Browser error logs from `ENABLE_OTEL_FRONTEND` are sent here too.
- `ENABLE_OTEL_FRONTEND`: Set to `true` to have users' browsers report JavaScript errors, Core Web Vitals, and app load times to ToolJet, which records them as metrics (default: `false`). Requires `ENABLE_OTEL=true`.
- `OTEL_FRONTEND_FLUSH_INTERVAL_SECONDS`: How often the browser sends buffered telemetry, in seconds, from `5` to `600` (default: `30`).
- `FRONTEND_METRICS_THROTTLE_LIMIT`: Maximum browser telemetry requests per user in each window (default: `60`).
- `FRONTEND_METRICS_THROTTLE_TTL`: Length of that window, in milliseconds (default: `60000`).

For comprehensive setup instructions, metrics details, and Grafana dashboard integration, see the [OpenTelemetry Observability](/docs/tj-setup/observability/observability-otel) documentation.

## <br/>

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)

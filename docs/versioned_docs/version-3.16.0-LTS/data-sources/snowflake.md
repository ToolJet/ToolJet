---
id: snowflake
title: Snowflake
---

ToolJet can connect to Snowflake databases to read and write data.

## Connection

To establish a connection with the Snowflake data source, you can either click on the **+ Add new Data source** button located on the query panel or navigate to the **[Data Sources](/docs/data-sources/overview/)** page from the ToolJet dashboard and choose Snowflake as the data source.

### Basic Authentication
Authenticates to Snowflake using a username and password to establish a direct connection with the specified account, role, and warehouse.

<img className="screenshot-full img-m" src="/img/datasource-reference/snowflake/basic-auth-ux.png" alt="ToolJet - Snowflake connection" />

:::info
Please make sure the **Host/IP** of the database is accessible from your VPC if you have self-hosted ToolJet. If you are using ToolJet cloud, please **whitelist** our IP.

You can find snowflake docs on network policies **[here](https://docs.snowflake.com/en/user-guide/network-policies.html)**.
:::

ToolJet requires the following to connect to Snowflake database.

- **Account**
- **Username**
- **Password**

Use your Snowflake **Account Identifier** as the value for the **Account** field.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/datasource-reference/snowflake/accounts-snowflake.png" alt="ToolJet - Snowflake" />

:::info
You can also configure for **[additional optional parameters](https://docs.snowflake.com/en/user-guide/nodejs-driver-use.html#additional-connection-options)**.
:::

### OAuth 2.0

### Generate OAuth Credentials from Snowflake

Follow the steps below to obtain the required OAuth credentials: Client ID, Client Secret, Authorization URL, and more.

**Step 1: Create a Security Integration**

Run the following query in a Snowflake worksheet:

```sql
USE ROLE ACCOUNTADMIN;

CREATE OR REPLACE SECURITY INTEGRATION tooljet_oauth
TYPE = OAUTH
ENABLED = TRUE
OAUTH_CLIENT = CUSTOM
OAUTH_CLIENT_TYPE = 'CONFIDENTIAL'
OAUTH_REDIRECT_URI = 'https://<your-tooljet-instance-redirect-url>/oauth/callback'
OAUTH_ISSUE_REFRESH_TOKENS = TRUE
OAUTH_REFRESH_TOKEN_VALIDITY = 7776000;
```
Replace **`your-tooljet-instance-redirect-url`** with your ToolJet Redirect URL.

**Step 2: Get Client Secret**

Run the following query:

```sql
SELECT SYSTEM$SHOW_OAUTH_CLIENT_SECRETS('TOOLJET_OAUTH');
```
From the output, copy this : `OAUTH_CLIENT_SECRET`

**Step 3: Get Client ID and OAuth Endpoints**

Run the following query:

```sql
DESC SECURITY INTEGRATION TOOLJET_OAUTH;
```
From the output, copy the following values:

- `OAUTH_CLIENT_ID` > **Client ID**
- `OAUTH_AUTHORIZATION_ENDPOINT` > **Authorization URL**
- `OAUTH_TOKEN_ENDPOINT` > **Token URL**

<img className="screenshot-full img-full" src="/img/datasource-reference/snowflake/generate-oauth-sf.png" alt="Generate Snowflake Credentials "/>

### OAuth2.0 - Custom App
Uses credentials from your own OAuth application to authenticate and authorize access via a custom OAuth provider configuration.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/datasource-reference/snowflake/oauth-custom-app.png" alt="ToolJet - Snowflake connection" />

You can enable **Authentication required for all users** in the configuration to enforce user-level authentication. When enabled, users are redirected to the OAuth 2.0 consent screen the first time a query from this data source is executed within an application, ensuring secure, user-specific authorization. ToolJet supports OAuth 2.0 authentication using both **Custom App** and **ToolJet App** configurations, allowing flexible integration based on your OAuth provider setup.

**Note**: After completing the OAuth flow, the query must be triggered again to load the data.

:::info
Snowflake provides multiple OAuth endpoint URLs, including account-level and profile-level endpoints.  

Ensure that you use at least one valid set of Authorization and Token URLs (preferably from the same source) when configuring the data source. Mixing endpoints from different sources may lead to authentication issues.
:::

### OAuth2.0 - ToolJet App

Uses ToolJet’s preconfigured OAuth application to simplify authentication without requiring you to create and manage your own OAuth app.

<img className="screenshot-full img-l" src="/img/datasource-reference/snowflake/oauth-tj-app.png" alt="ToolJet - Snowflake connection" />

## Multi-Factor Authentication (MFA) in Snowflake

Multi-Factor Authentication (MFA) adds an extra layer of security to your Snowflake account by requiring a second form of verification during login.

**When MFA is enabled :** 
- Users will be prompted for verification during the Snowflake login step in the OAuth flow.
- PAT are used instead of passwords for third party services.

 ## Programmatic Access Tokens  (PAT) in Snowflake

Programmatic Access Tokens (PAT) allow secure, token-based authentication to Snowflake without using a password. PAT is useful when MFA is enabled and password-based authentication is blocked.

**How to Generate a PAT**

1. From the Snowflake UI, go to:
   **Settings > Authentication**
2. Under **Programmatic access tokens**, click **Generate token**
3. Provide required details (name, expiration, etc.)
4. Copy and store the token securely.
5. To use PAT, a **network policy** must be configured. For more info, check **[here](https://docs.snowflake.com/en/user-guide/network-policies.html)**

Example:

```sql
CREATE NETWORK POLICY allow_all_policy
ALLOWED_IP_LIST = ('0.0.0.0/0');
```

:::info
- The token is shown only once. Store it securely. 
- PAT cannot be used as replacement for password when signing in to Snowflake.
:::

## Querying Snowflake

1. Click on **+ Add** button of the query manager at the bottom panel of the editor.
2. Select the **Snowflake** datasource added in previous step.
3. Select the **SQL Mode** form the dropdown and enter the query.
4. Click on the **Preview** button to preview the output or Click on the **Run** button to trigger the query.

<img className="screenshot-full img-full" src="/img/datasource-reference/snowflake/query-v5.png" alt="ToolJet - Snowflake query" />

```sql
select * from "SNOWFLAKE_SAMPLE_DATA"."WEATHER"."DAILY_14_TOTAL" limit 10;
```

:::tip
Query results can be transformed using transformations. Read our [transformations](/docs/app-builder/custom-code/transform-data) documentation to learn more.
:::
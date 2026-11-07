---
id: upgrade-to-v3.16
title: ToolJet 3.16 Migration Guide
slug: /setup/upgrade-to-v3.16/
---

ToolJet 3.16 introduces a set of **new features and platform updates**. All changes are **non-breaking**, but there are a few that may require minor layout adjustments. This guide summarise all key updates.

:::tip Before upgrading
We recommend reviewing this guide and testing in a staging environment to evaluate UI differences. For self-hosted users, ensure `.env` changes are applied for audit log retention.
:::

:::info Upgrading to 3.20 LTS
See [Upgrading to 3.20 LTS](#upgrading-to-320-lts) for the changes between 3.16 LTS and 3.20 LTS.
:::

## Suggested Updates (Medium Severity)

### App Builder Changes

These are layout or usability improvements that may require tweaks depending on your app setup.

| Area                                | Change                                                                                                                                                                                                                                |
| :---------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| App Header                          | The **Hide app header** option has been deprecated and is now included under the Page & Navigation features. If you previously had the app header hidden, it will now be displayed. Ensure your layout accounts for this change.      |
| Dark Mode & Header                  | **Toggle App Mode icon** disappears if the page menu is hidden. **Workaround**: Use a Button with the `Toggle App Mode` action.                                                                                                       |
| Page Menu (Text and icon)           | For page menus using the **Text and icon** style, icons will now stay visible when the menu is collapsed. This was not the case before and may slightly affect your layout.                                                           |
| Page Menu (Text only and Icon only) | Page menus using **Text only** or **Icon only** styles can no longer be collapsed. If your layout depended on collapsing these, adjustments may be needed.                                                                            |
| Branding                            | The app logo and title now appear side-by-side in the top-left corner of the page menu. The separate top bar that previously held the title and logo has been removed. This change may affect layout balance and branding visibility. |

### Platform Changes

Audit logs are the reports of all the activities done in your ToolJet account. Below are the default retention periods that determine how long these logs are stored, depending on your deployment type.

| Deployment  | Notes                                                                                   |
| :---------- | :-------------------------------------------------------------------------------------- |
| Cloud       | No change. Audit logs remain fixed to 90 days.                                          |
| Self-Hosted | Audit logs now default to 90 days. Override via `.env`: `AUDIT_LOGS_RETENTION_PERIOD=90` |

#### Group Synchronization (Migration Only)

Group synchronization for LDAP and SAML has moved from **environment variables** to **UI-based configuration**.

Previously, the following variables were used during login:

- `DISABLE_LDAP_GROUP_SYNC=true`
- `DISABLE_SAML_GROUP_SYNC=true`

In ToolJet 3.16, these variables are retained **only for backward compatibility during migration**.  
For new installations, they have **no effect**.

After upgrading, group synchronization should be managed exclusively via the UI.


## Minor Component Changes (Low Severity)

These changes may cause **minor visual shifts** but require no action unless affecting your layout.

| Component        | Change Description                                                                                                    |
| :--------------- | :-------------------------------------------------------------------------------------------------------------------- |
| Container        | Padding updates applied. This may slightly affect alignment of tightly placed child components like headers or cards. |
| File Picker      | Enhanced UI with added file size range selection, list titles, and improved visual feedback.                          |
| Tab              | Tab headers have undergone minor visual polish, including alignment and spacing improvements.                         |
| List View        | Padding on individual records has been slightly adjusted for consistency with other layout components.                |
| Form             | Internal padding revised to align with updated container spacing logic.                                               |
| Table            | A horizontal scrollbar has been added for overflow content. Scrollbar is now also wider for better accessibility.     |
| Daterange Picker | Calendar popup design modernised with better visual grouping and clarity of date selection.                           |
| Steps            | Step indicators have updated padding and width, improving alignment and usability in multi-step forms.                |
| Image            | Fallback UI for broken images has been improved—display is cleaner and more informative.                              |
| Dividers         | Side padding removed on both horizontal and vertical dividers, making them appear slightly larger or more prominent.  |
| Canvas           | When the page menu expands, the canvas now shrinks more predictably to avoid layout clipping.                         |
| Page Menu (Icon) | The pin icon has been replaced with a hamburger menu icon to better reflect toggle behaviour in collapsed mode.       |

## Upgrading to 3.20 LTS

The LTS release after 3.16 is 3.20. There are no 3.17, 3.18, or 3.19 LTS releases, so you upgrade from any 3.16 LTS version directly to 3.20 LTS. This section lists the changes between the last 3.16 LTS release (`v3.16.33-lts`) and `v3.20.246-lts` that affect self-hosted deployments. If you're upgrading from a version earlier than 3.16, also review the 3.16 changes above.

:::tip Before upgrading
Back up your ToolJet and ToolJet Database PostgreSQL databases, and test the upgrade in a staging environment. Keep your existing environment variables in place until the upgrade has finished, because some one-time migrations read them during the upgrade.
:::

### Required Actions (High Severity)

#### Workflow Scheduling Moves From Temporal to BullMQ

Workflows no longer use Temporal. Workflow jobs, including scheduled runs, are now queued in Redis using BullMQ, and Temporal is no longer included in the ToolJet image.

- Set `WORKER=true` on at least one ToolJet instance. Only instances with `WORKER=true` process queued workflow runs, including scheduled ones. When a worker starts, it loads all active schedules from the database.
- In 3.16, setting `WORKER` started a worker process without a web server. In 3.20, every instance serves the ToolJet app and API, and `WORKER=true` adds job processing.
- If you run more than one ToolJet instance, or separate worker instances, connect all of them to the same external Redis instance (v7.x recommended). The Redis bundled in the ToolJet image works only for a single instance.
- Remove `ENABLE_WORKFLOW_SCHEDULING`, `WORKFLOW_WORKER`, `TOOLJET_WORKFLOWS_TEMPORAL_NAMESPACE`, `TEMPORAL_SERVER_ADDRESS`, and any Temporal services from your deployment. They have no effect.

For step-by-step instructions, see [Migrating Workflows from Temporal to BullMQ](/docs/setup/workflow-temporal-to-bullmq-migration).

#### Custom CA Certificates on the Enterprise Image

The Enterprise image's startup script sets `NODE_EXTRA_CA_CERTS` to the AWS RDS certificate bundle included in the image. This replaces any `NODE_EXTRA_CA_CERTS` value you pass as a container environment variable, for example in Docker Compose `environment`, Kubernetes `env`, or Helm values. ToolJet then no longer trusts your [custom CA certificate](/docs/setup/env-vars#custom-ca-certificate), and connections to endpoints signed by it fail with certificate errors.

If you use a custom CA certificate, set `NODE_EXTRA_CA_CERTS` in a `.env` file mounted at `/app/.env` instead. The startup script loads this file after it sets the RDS bundle, so your value is used. If you also connect to Amazon RDS over SSL, point `NODE_EXTRA_CA_CERTS` to a PEM file that contains both your CA certificate and the [RDS certificate bundle](https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem).

### Suggested Updates (Medium Severity)

#### Redis Credentials

ToolJet now passes Redis credentials to the workflow job queue. In 3.16, the job queue used only `REDIS_HOST` and `REDIS_PORT`. Different components read different variable names:

| Component | Variables read |
| :--- | :--- |
| Workflow job queue | `REDIS_HOST`, `REDIS_PORT`, `REDIS_USERNAME`, `REDIS_PASSWORD`, `REDIS_DB`, `REDIS_TLS` |
| Multiplayer editing (Enterprise Edition) | `REDIS_URL`, or `REDIS_HOST`, `REDIS_PORT`, `REDIS_USER`, `REDIS_PASSWORD` |

If your Redis instance requires a username, set both `REDIS_USERNAME` and `REDIS_USER` to it. Set `REDIS_TLS=true` if your Redis instance requires TLS.

#### Server Log Level and Format

- **Quieter default logs:** In production, ToolJet now logs at `warn` level by default, so container logs no longer include a line for every HTTP request. Set `LOG_LEVEL=info` to keep per-request logs. See [Logging](/docs/setup/env-vars#logging).
- **Log level as text:** The `level` field in JSON logs is now a name, such as `"level":"info"`, instead of a number, such as `"level":30`. Update any log pipelines, filters, or alerts that match on the numeric value.

#### OpenID Connect Custom Scopes

ToolJet no longer reads `OIDC_CUSTOM_SCOPES` at sign-in. During the upgrade, a one-time migration copies its value into every OpenID Connect SSO configuration, so keep the variable set until the upgrade has finished. After that, manage scopes in the **Custom Scopes** field of the OpenID Connect SSO settings, and remove the variable.

ToolJet now always requests the `offline_access` scope, along with `openid`, `email`, and `profile`, so it can refresh OIDC sessions. Make sure your identity provider allows this scope for the ToolJet application. ToolJet no longer requests the `groups` scope from Microsoft Entra ID.

#### Two-Factor Authentication Secret

[Two-factor authentication](/docs/user-management/authentication/2fa) is new in 3.20 and is off by default. Before you turn it on, set `MFA_MASTER_SECRET` to a long random value, for example the output of `openssl rand -hex 32`, and use the same value on every ToolJet instance. If it isn't set, setting up 2FA and signing in with 2FA fail with the error `MFA_MASTER_SECRET is not configured. Set it in the environment before enabling two-factor authentication.`

Don't change `MFA_MASTER_SECRET` after users set up 2FA. Each user's 2FA key is derived from it, so changing it invalidates every authenticator app that's already set up.

#### Custom Component Library Storage

[Custom Component Libraries](/docs/app-builder/custom-component-library/overview) store uploaded bundles on the ToolJet server's local disk, in `/data/custom-components` by default. The ToolJet image doesn't create this directory and doesn't run as root. Before you publish libraries, mount a writable, persistent volume at `/data/custom-components`, or set `CUSTOM_COMPONENT_STORAGE_PATH` to a writable, persistent directory. If you run more than one ToolJet instance, use a volume shared by all of them, so every instance can serve every bundle.

### Optional Changes (Low Severity)

#### SSRF Protection for Outbound Requests

ToolJet can now block requests from data sources to internal network addresses (server-side request forgery, or SSRF, protection). It's off by default in the Enterprise Edition (turn it on with `SSRF_PROTECTION_ENABLED=true`) and on by default in the Community Edition (turn it off with `SSRF_PROTECTION_ENABLED=false`). Private network ranges (`10.0.0.0/8`, `172.16.0.0/12`, and `192.168.0.0/16`) stay reachable. For what's blocked and the related settings, see [SSRF Protection](/docs/setup/env-vars#ssrf-protection).

#### New Optional Settings

| Variable | Description |
| :--- | :--- |
| `OTEL_EXPORTER_OTLP_LOGS` | OTLP/HTTP endpoint for logs. When set with `ENABLE_OTEL=true`, ToolJet sends its server logs to this endpoint at the `LOG_LEVEL` level, in addition to container logs. See [Observability](/docs/setup/env-vars#observability). |
| `TOOLJET_WORKFLOW_SANDBOX_BYPASS` | Python code in workflows runs in an nsjail sandbox. On platforms that don't allow it, such as AWS Fargate or Render, Python nodes fail. Set to `true` to run Python without isolation. |

#### Image Changes

- The Enterprise image no longer includes Neo4j. You can remove `NEO4J_*` variables.
- The Enterprise image is now based on Debian 13 instead of Debian 12. If you build your own image on top of it, check your package names. For example, `libaio1` is now `libaio1t64`.

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)

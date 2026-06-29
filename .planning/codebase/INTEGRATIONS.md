# External Integrations

**Analysis Date:** 2026-06-29

ToolJet integrates externally on two levels: (1) **platform infrastructure** (databases, queues, auth, observability) used by `server/`, and (2) **user-facing data-source connectors** in `plugins/packages/` (48 connectors) that end users wire to their own external systems.

## APIs & External Services

**AI / LLM (server-side features):** — `server/package.json`
- Anthropic - SDK: `@ai-sdk/anthropic`
- OpenAI - SDK: `@ai-sdk/openai`
- Google (Gemini) - SDK: `@ai-sdk/google`
- Mistral - SDK: `@ai-sdk/mistral`
- Unified via `ai` 4.3 SDK

**Platform / billing & ops:**
- Stripe - `stripe` 20.1 (server billing); also a user connector `plugins/packages/stripe`
- HubSpot - `@hubspot/api-client` 13
- GitHub - `@octokit/rest` 22 (used by Git sync / `git-oauth.service.ts`)
- Cloudflare - `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID` env (custom domain management)
- Temporal - `@temporalio/*` (workflow execution backend)

**User data-source connectors — `plugins/packages/` (48):**
- Databases: `postgresql`, `mysql`, `mariadb`, `mssql`, `oracledb`, `mongodb`, `redis`, `couchdb`, `rethinkdb`, `cosmosdb`, `dynamodb`, `clickhouse`, `snowflake`, `bigquery`, `databricks`, `athena`, `saphana`, `influxdb`, `elasticsearch`, `typesense`
- APIs / SaaS: `restapi`, `graphql`, `openapi`, `grpc`, `grpcv2`, `airtable`, `baserow`, `nocodb`, `notion`, `appwrite`, `googlesheets`, `googlesheetsv2`, `woocommerce`, `zendesk`, `slack`, `twilio`, `n8n`, `stripe`
- Storage: `s3`, `gcs`, `minio`, `azureblobstorage`
- Email: `smtp`, `sendgrid`, `mailgun`, `amazonses`
- Shared base: `plugins/packages/common` (`@tooljet-plugins/common`)

Each connector is an independent package (`lib/` source, `__tests__/`, manifest); scaffolded via `@tooljet/cli`.

## Data Storage

**Databases:** — `server/ormconfig.ts`
- PostgreSQL (primary application DB)
  - Connection: `PG_HOST`, `PG_PORT`, `PG_DB`, `PG_USER`, `PG_PASS` (or `DATABASE_URL`)
  - Client: TypeORM 0.3 + `pg` 8.7
- ToolJet DB (secondary Postgres, user-data tables, accessed via PostgREST)
  - Connection: `TOOLJET_DB`, `TOOLJET_DB_HOST`, `TOOLJET_DB_PORT`, `TOOLJET_DB_USER`, `TOOLJET_DB_PASS` (or `TOOLJET_DB_URL`)
  - `PGRST_HOST` (PostgREST gateway, see `docker-compose.yaml`)
- SSL config supports `CA_CERT` env

**File Storage:**
- Pluggable: S3 / GCS / MinIO / Azure Blob via plugin connectors; local filesystem fallback for app assets

**Caching / Queues:**
- Redis - `ioredis` 5
  - Connection: `REDIS_HOST`, `REDIS_PORT`, `REDIS_USERNAME`, `REDIS_PASSWORD`, `REDIS_DB`, `REDIS_TLS`
  - Used by: BullMQ job queues, caching, sessions

## Authentication & Identity

**SSO providers — `server/src/modules/auth/oauth/util-services/`:**
- Google OAuth - `google-oauth.service.ts` (`google-auth-library`)
- Git / GitHub OAuth - `git-oauth.service.ts` (`@octokit/rest`)
- OIDC - `oidc-auth.service.ts` (`openid-client` 5.4; `OIDC_CONNECTION_TIMEOUT` env)
- SAML - `saml.service.ts` (`@node-saml/node-saml` 5.1)
- LDAP - `ldap.service.ts` (`ldapts` 8)

**Session / tokens:**
- JWT via Passport - `server/src/modules/session/jwt/jwt.strategy.ts` (`passport-jwt`, `@nestjs/jwt`)
- Password hashing: `bcrypt` 6
- MFA/TOTP: `otpauth` 9.4
- SCIM provisioning: `scimmy` 1.3
- Secret encryption: lockbox pattern (`futoin-hkdf`, `LOCKBOX_MASTER_KEY`; rotate via `npm run rotate:keys`)

## Monitoring & Observability

**Error Tracking:**
- Sentry - `@sentry/nestjs` (server), `@sentry/react` + `@sentry/webpack-plugin` (frontend)

**Tracing & Metrics:**
- OpenTelemetry - `@opentelemetry/*` + `nestjs-otel`; toggled via `ENABLE_OTEL`, exporters `OTEL_EXPORTER_OTLP_TRACES` / `OTEL_EXPORTER_OTLP_METRICS`, `OTEL_HEADER`, `APM_VENDOR`
- Prometheus - `prom-client` (`ENABLE_METRICS`)
- Queue dashboard - `@bull-board/*` (`TOOLJET_QUEUE_DASH_PASSWORD`)

**Logs:**
- `nestjs-pino` + `winston` + `winston-daily-rotate-file`; `LOG_FILE_PATH`, `LOGGER_REDACT`

**Product analytics:**
- PostHog - `posthog-js` (frontend)

## CI/CD & Deployment

**Hosting / build:** Docker images (`docker/`), Render/GCP deploy workflows, Packer AMI builds

**CI Pipeline — `.github/workflows/`:**
- `ci.yml`, `code-coverage.yml` - build/test/coverage
- `cypress-platform.yml`, `cypress-appbuilder.yml`, `cypress-marketplace.yml` - E2E
- `cloud-frontend.yml`, `cloud-frontend-gcp.yml`, `deploy-to-stage.yml`, `render-preview-deploy-v2.yml` - deploy
- `docker-release.yml`, `manual-docker-build.yml`, `packer-build.yml` - image/AMI build
- `marketplace-plugins-deploy*.yml` - plugin publishing
- `license-compliance.yml`, `grype-slack-notify.yml` - security/compliance

## Environment Configuration

**Required / notable env vars (names only):**
- DB: `PG_HOST/PORT/DB/USER/PASS` or `DATABASE_URL`, `TOOLJET_DB_*` / `TOOLJET_DB_URL`, `CA_CERT`
- Redis: `REDIS_HOST/PORT/USERNAME/PASSWORD/DB/TLS`
- Security: `LOCKBOX_MASTER_KEY`
- Host/serving: `TOOLJET_HOST`, `TOOLJET_SERVER_URL`, `TOOLJET_SERVER_PORT`, `PORT`, `SUB_PATH`, `SERVE_CLIENT`, `LISTEN_ADDR`, `TOOLJET_HTTP_PROXY`
- Mail: `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_PORT`, `SMTP_DOMAIN`, `SMTP_DISABLED`, `DEFAULT_FROM_EMAIL`
- Feature flags: `DISABLE_SIGNUPS`, `ENABLE_MULTIPLAYER_EDITING`, `COMMENT_FEATURE_ENABLE`, `ENABLE_CUSTOM_DOMAINS`, `ENABLE_MARKETPLACE_DEV_MODE`, `ENABLE_PASSWORD_COMPLEXITY_RULES`, `TOOLJET_EDITION`
- Workflows: `WORKER`, `TOOLJET_WORKFLOW_CONCURRENCY`, `WORKFLOW_TIMEOUT_SECONDS`
- Observability: `ENABLE_OTEL`, `ENABLE_METRICS`, `OTEL_*`, `APM_VENDOR`

**Secrets location:** Root `.env` (gitignored); `.env.test` for tests; template `.env.example`. Datasource credentials encrypted at rest via lockbox.

## Webhooks & Callbacks

**Incoming:**
- OAuth/SSO callbacks - `server/src/modules/auth/oauth/controller.ts`
- Email listener / inbound mail - `server/src/modules/email-listener`
- Workflow webhook triggers - `server/src/modules/workflows`

**Outgoing:**
- SSE streaming to frontend - `eventsource-parser` (server), `@microsoft/fetch-event-source` (frontend)
- WebSocket events - `@nestjs/websockets`; multiplayer via `y-websocket` / Yjs
- Outbound HTTP from connectors - `got` 11, `undici` 7

---

*Integration audit: 2026-06-29*

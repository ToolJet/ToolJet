# Ubiquitous Language

A formal glossary of ToolJet domain terminology. When code, docs, or conversation use different words for the same concept, this document declares the canonical term.

---

## Instance & Tenancy

| Term | Definition | Aliases to avoid |
|------|-----------|-----------------|
| **Instance** | A single ToolJet deployment (self-hosted or cloud) that contains one or more workspaces | Server, installation, cluster |
| **Workspace** | The top-level tenant containing apps, users, data sources, and settings | Organization (legacy code entity name), tenant, account |
| **Personal Workspace** | An individual user's private workspace, restrictable by Super Admin | My workspace, user workspace |
| **Workspace Slug** | The URL-friendly identifier for a workspace (e.g., `app.corp.com/<slug>`) | Workspace ID (different — slug is user-facing) |
| **User** | An authentication identity that can belong to multiple workspaces; statuses: invited, verified, active, archived | Account, member, person |
| **User Source** | How a user was created: signup, invite, google, git, openid, ldap, saml, workspace_signup | Auth method (that's the protocol, not the creation path) |
| **Super Admin** | An instance-level administrator with unrestricted access across all workspaces, ToolJet Database, and instance settings | Root user, global admin |
| **Session** | An authenticated login session tied to a user, device, and expiry | Token (a session contains tokens, but is not one) |
| **Onboarding** | The first-run setup flow for new users | Setup wizard |

## Roles & Permissions

| Term | Definition | Aliases to avoid |
|------|-----------|-----------------|
| **Admin** | Workspace-level role with full access to settings, user management, and all resources | Workspace admin (redundant — Admin is always workspace-level; Super Admin is instance-level) |
| **Builder** | Workspace-level role that can create/edit apps, data sources, and queries; permissions are configurable | Editor (legacy license code term), developer |
| **End User** | Workspace-level role that can only view and interact with released apps they're given access to | Viewer (legacy license code term), consumer |
| **Group** | A named collection of users with shared permissions; includes both default role groups and custom groups | Team (overloaded with the Team plan) |
| **Custom Group** | An admin-defined permission group beyond the three default roles (EE feature) | Custom role |
| **Permission** | A granular access right on a specific resource (app, data source, folder, constant) | Privilege, access level |
| **Ability** | Internal CASL-based authorization rule set evaluated at runtime (code concept, not user-facing) | Policy, rule |

## App Building

| Term | Definition | Aliases to avoid |
|------|-----------|-----------------|
| **App** | A ToolJet application; types: `FRONT_END` (visual app), `WORKFLOW` (automation), `MODULE` (reusable building block) | Application (only in marketing prose), project |
| **App-Builder** | The visual IDE/editor where apps are constructed | Editor (ambiguous with Builder role), studio |
| **Page** | A view/screen within an app; one page is designated the Home Page | Screen, view, route |
| **Page Handle** | The unique URL slug for a page within an app | Page slug, page path |
| **Component** | A pre-designed, drag-and-drop building block on the canvas (45+ built-in types) | Widget (informal; docs folder is `widgets/` but content says "Components") |
| **Custom Component** | A user-created component built with React for functionality beyond built-in components | External component |
| **Layout** | Positioning metadata (top, left, width, height) for a component on the canvas grid | Position |
| **Canvas** | The visual workspace area in the App-Builder where components are placed | Stage, board |
| **Left Sidebar** | App-Builder panel containing Pages, Inspector, and Debugger | Nav panel |
| **Right Sidebar** | App-Builder panel for component properties and styles | Properties panel, config panel |
| **Toolbar** | The top bar of the App-Builder with version management, undo/redo, preview, and release | Header bar |
| **Module** | A reusable app-level building block shared across apps (EE feature; app type `MODULE`) | Library component, shared module (be careful — "module" also means NestJS module in backend) |
| **Template** | A pre-built app sample that users can clone as a starting point (60+ across 10 categories) | Starter, boilerplate |
| **Conditional Styling** | Dynamic styles applied to components based on runtime conditions | Dynamic styles |
| **Custom CSS** | User-defined free-form CSS applied at component or app level | Custom Styling (related but different — styling is the broader concept) |
| **Theme** | A workspace-wide color and font scheme (EE feature) | Skin, style preset |

## Events & Actions

| Term | Definition | Aliases to avoid |
|------|-----------|-----------------|
| **Event** | A trigger fired by user interaction or system state (e.g., button click, query completion) | Trigger (use only for workflows) |
| **Event Handler** | A configured response linking an event to one or more actions; can be chained | Listener, callback |
| **Action** | A function executed in response to an event (e.g., Show Alert, Run Query, Switch Page, Set Variable) | Command, operation |
| **Component-Specific Action** | An action that targets a specific component instance (e.g., scroll into view, set value) | Component method |

## Variables & State

| Term | Definition | Aliases to avoid |
|------|-----------|-----------------|
| **Variable** | An app-scoped runtime value set via `setVariable(key, value)` | Global variable (ambiguous with Workspace Constant) |
| **Page Variable** | A page-scoped runtime value set via `setPageVariable(key, value)` | Local variable |
| **Exposed Variable** | An auto-generated, read-only variable holding component state (e.g., `components.textinput1.value`) | Component state, props |
| **Workspace Constant** | A reusable, non-secret value available across all apps in a workspace; resolved server-side; syntax: `{{constants.name}}` | Global Constant (acceptable alias), Workspace Variable (deprecated), Environment Variable (deprecated) |
| **Workspace Secret** | An encrypted workspace constant for sensitive data; masked in frontend; syntax: `{{secrets.name}}` | Secret key, API key (those are values stored in secrets, not the concept itself) |
| **Environment-Specific Configuration** | Constants and secrets can hold different values per environment (dev/staging/prod) | Per-env config |
| **Inspector** | The App-Builder panel for viewing all runtime state (sections: Queries, Components, Globals, Variables, Page, Constants) | State viewer, debugger (separate panel) |
| **Debugger** | The App-Builder panel for debugging code execution errors | Console (different — browser console is separate) |
| **Transformation** | A JavaScript/Python transform applied to query results before binding to components | Formatter, mapper |

## Versioning & Deployment

| Term | Definition | Aliases to avoid |
|------|-----------|-----------------|
| **Version** | A named development snapshot of an app; multiple developers can work on separate versions | Branch (not git-based), revision |
| **Release** | The act of publishing a version to end users; makes the app accessible via its public URL | Deploy (more accurate for environments), publish |
| **Environment** | A deployment stage — development, staging, production — with per-environment data source configs | Stage (informal but acceptable) |
| **Promote** | Moving an app version from one environment to the next (e.g., dev to staging to production) (EE feature) | Deploy, push |
| **Maintenance Mode** | A flag that takes a released app offline temporarily while preserving the release | Disabled, offline |
| **App History** | An audit trail of changes to an app version with undo capability (EE feature) | Changelog, revision history |

## Data Layer

| Term | Definition | Aliases to avoid |
|------|-----------|-----------------|
| **Data Source** | A configured connector to an external database, API, or service — NEVER abbreviate to "ds" | Datasource (one word, used in some URL paths but not canonical), connector, integration |
| **Global Data Source** | A data source configured at workspace level, shared across all apps | Workspace data source |
| **App-Level Data Source** | A data source scoped to a single app (code: "local" type) | Local data source (code term, not user-facing) |
| **Query** | A parameterized operation against a data source; created in the Query Panel | Data Query (formal alias, use when distinguishing from SQL queries) |
| **Query Panel** | The App-Builder panel for creating and managing queries | Query bar |
| **Query Manager** | The left section of the Query Panel listing all queries | Query list |
| **Query Editor** | The right section of the Query Panel for writing/configuring a query | Query builder |
| **ToolJet Database** | ToolJet's built-in PostgreSQL-backed database offering | TJDB (marketing shorthand, avoid in formal contexts), internal DB |
| **Internal Table** | A table within ToolJet Database | TJ table |
| **Run JavaScript** | A special query type that executes JavaScript code instead of querying a data source | RunJS (code shorthand) |
| **Run Python** | A special query type that executes Python code instead of querying a data source | RunPy (code shorthand) |
| **REST API** | Built-in data source type for making HTTP requests to external APIs | HTTP connector |
| **Sample Data Source** | A pre-configured demo data source provided during onboarding | Demo data source |

## Sharing, Collaboration & Compliance

| Term | Definition | Aliases to avoid |
|------|-----------|-----------------|
| **Folder** | A container for organizing apps within a workspace | Directory, category |
| **Public App** | An app accessible without authentication via its shareable URL | Open app, unauthenticated app |
| **Shareable URL** | The public URL for a released app that can be shared with end users | Share link, public link |
| **Embeddable Link** | A URL for embedding a ToolJet app in an iframe within another application | Embed URL, iframe link |
| **Thread** | A spatially-positioned comment thread on an app canvas (x/y coordinates) | Discussion |
| **Comment** | An individual message within a thread | Note, annotation |
| **Multiplayer Editing** | Real-time collaborative editing of an app by multiple users simultaneously (EE feature) | Co-editing, real-time collaboration |
| **Audit Log** | A compliance record of user actions (who did what, when); retention varies by plan | Activity log, event log |
| **Git Sync** | Bidirectional sync between app versions and a Git repository (EE feature) | Version control (broader concept), git integration |
| **Import** | Loading an app definition (JSON) into a workspace from another ToolJet instance | Restore |
| **Export** | Saving an app definition (JSON) for transfer to another ToolJet instance | Backup (different purpose) |

## Automation (Workflows)

| Term | Definition | Aliases to avoid |
|------|-----------|-----------------|
| **Workflow** | A visual automation composed of nodes and edges, executed on triggers or schedules (EE feature) | Flow, pipeline, automation |
| **Workflow Trigger** | What starts a workflow: `MANUAL`, `SCHEDULE`, or `WEBHOOK` | Event (use for component-level; Trigger is for workflows) |
| **Workflow Execution** | A single run of a workflow; statuses: triggered, running, completed, error, terminated | Run, job |
| **Workflow Execution Node** | A single step within a workflow execution | Task, step |
| **Workflow Schedule** | A cron/trigger configuration for recurring workflow runs | Cron job, scheduled task |
| **Workflow Bundle** | Compiled workflow code (JS or Python, runtime version, binary); statuses: none, building, ready, failed | Build artifact |
| **Response Node** | The terminal node in a webhook-triggered workflow that sends data back to the caller | Output node, return node |
| **Webhook** | An HTTP endpoint that triggers a workflow from external systems | API endpoint (webhooks are a specific pattern) |

## AI Features

| Term | Definition | Aliases to avoid |
|------|-----------|-----------------|
| **AI Builder** | AI-powered app creation assistant that generates apps from natural language prompts | AI Assistant (too generic) |
| **AI Copilot** | In-editor AI assistant for code suggestions and fixes within the App-Builder | Code assistant |
| **AI Credits** | Per-builder monthly allocation for AI features; varies by plan | Tokens (ambiguous with auth tokens) |
| **AI Conversation** | A persistent chat session with the AI assistant within an app context | Chat, AI thread |

## Licensing, Plans & Extensibility

| Term | Definition | Aliases to avoid |
|------|-----------|-----------------|
| **Edition** | The product tier determined at build/deploy time: CE (Community), EE (Enterprise), Cloud | Version (ambiguous with app versioning) |
| **License** | A cryptographic key that unlocks features for an edition; has a type and expiry date | Key, activation code |
| **License Type** | One of: `basic`, `trial`, `business`, `enterprise` | Plan type (plans and license types have different naming) |
| **Plan** | A pricing tier on ToolJet Cloud determining feature limits and billing | Tier, pricing level |
| **Free Plan** | Entry cloud plan (code id: `basic`) | Basic plan (code name, not user-facing) |
| **Pro Plan** | Mid cloud plan (code id: `flexible`) | Flexible plan (code name, not user-facing) |
| **Team Plan** | Full-featured cloud plan — SSO, custom groups, audit logs, git sync, multi-environment (code id: `business`) | Business plan (code name, not user-facing) |
| **Enterprise Plan** | Custom pricing, air-gapped deployment, custom AI, premium SLAs | — |
| **License Terms** | The feature limits and flags encoded in a license (interface: `Terms`) | License config, license features |
| **Feature Flag** (license) | A boolean in license terms gating a capability (e.g., `oidc`, `auditLogs`, `gitSync`) | Feature gate, toggle |
| **Subscription** | A Stripe-managed billing subscription for a workspace | Payment, billing account |
| **Billing Cycle** | Monthly or yearly subscription period | Payment frequency |
| **Trial** | A time-limited license granting access to paid features for evaluation | Demo, evaluation |
| **Plugin** | A data source connector package, either built-in or from the marketplace | Connector, adapter, integration |
| **Marketplace Plugin** | A third-party contributed plugin installed from the ToolJet marketplace | Community plugin, extension |
| **White Labelling** | Custom branding (logo, text, favicon) applied to a workspace or the entire platform | Branding, customization |
| **Custom Domain** | A user's own domain pointed at their ToolJet instance | Vanity domain |
| **SCIM** | System for Cross-domain Identity Management; automated user provisioning (EE feature) | User sync, directory sync |
| **SSO** | Single Sign-On; supported providers: OIDC, SAML, LDAP, Google, GitHub | Federated login |
| **Personal Access Token (PAT)** | An API token scoped to APP or WORKSPACE for external API access | API key (different — PATs have scoped permissions) |
| **External API** | ToolJet's outward-facing REST API for programmatic access (import/export apps, trigger workflows) | Public API |

---

## Relationships

- An **Instance** contains one or more **Workspaces**
- A **Workspace** contains **Apps**, **Users**, **Data Sources**, **Folders**, **Workspace Constants**, and **Workspace Secrets**
- A **User** belongs to one or more **Workspaces** via a **Role** (Admin, Builder, or End User) and zero or more **Groups**
- An **App** contains one or more **Pages**, each containing **Components** with **Layouts**
- An **App** has one or more **Versions**; one version may be the current **Release**
- A **Component** exposes **Exposed Variables** and fires **Events**
- An **Event Handler** links an **Event** to one or more **Actions**
- A **Query** connects an **App** to a **Data Source** and may apply a **Transformation** to results
- A **Global Data Source** is shared across all **Apps** in a **Workspace**; an **App-Level Data Source** belongs to one **App**
- An **Environment** (dev/staging/prod) holds per-environment **Data Source** configurations and **Workspace Constant** values
- A **Workflow** is triggered by a **Workflow Trigger** (manual/schedule/webhook) and produces a **Workflow Execution** composed of **Workflow Execution Nodes**
- A **Plan** determines the **License Terms**, which gate **Features** via **Feature Flags**
- A **Plugin** backs a **Data Source** type; **Marketplace Plugins** extend the built-in set

---

## Flagged Ambiguities

- **"Organization"** is used throughout the backend codebase (`Organization` entity, `organizationId` columns, `organization_users` table) but user-facing docs and UI exclusively say **"Workspace"**. These are the same concept. Use **Workspace** in all new code, docs, and conversation. The code entity name is a legacy artifact.

- **"Widget"** appears as the docs folder name (`docs/docs/widgets/`) but the content inside consistently says **"Components"**. The `widgets` folder name is historical. Use **Component** everywhere.

- **"Editor" / "Viewer"** appear in license code (`editor` count, `NumberOfEditor`, `viewer` count) but user-facing terminology is **Builder** and **End User** respectively. Use the user-facing terms.

- **"Workspace Variable" / "Environment Variable"** appear in legacy docs and some code paths but the current canonical terms are **Workspace Constant** (non-secret) and **Workspace Secret** (encrypted). The variable terminology is deprecated.

- **Plan code IDs vs. user-facing names** diverge: `basic` = **Free**, `flexible` = **Pro**, `business` = **Team**, `enterprise` = **Enterprise**. Always use user-facing plan names in docs and conversation.

- **"Event" vs. "Trigger"** serve different domains: **Event** is a component/UI-level interaction (button click, query success). **Trigger** starts a **Workflow** (manual, schedule, webhook). Do not use them interchangeably.

- **"Module"** is heavily overloaded: in the backend it's a NestJS architectural module (`server/src/modules/*`); in the frontend it's a reusable app building block (EE feature, app type `MODULE`). Always qualify which you mean.

- **"Data Source" scope** is often unclear. A **Global Data Source** is workspace-level and shared across apps. An **App-Level Data Source** (code: "local" type) belongs to a single app. The distinction matters for permissions and environment configuration.

- **"Custom Styling" vs. "Custom CSS" vs. "Theme"** are three related but distinct concepts: **Custom Styling** is per-component conditional styles. **Custom CSS** is free-form CSS at app level. **Theme** is a workspace-wide color/font scheme (EE). Don't conflate them.

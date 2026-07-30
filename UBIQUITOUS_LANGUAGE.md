# Ubiquitous Language

A formal glossary of ToolJet domain terminology. When code, docs, or conversation use different words for the same concept, this document declares the canonical term.

The "Also appears as" column maps only names that genuinely occur in code, docs, or issues (legacy names, overloaded terms) back to the canonical term — it is a translation map, not a synonym list. "—" means the term has no known collision.

---

## Instance & Tenancy

| Term | Definition | Also appears as |
|------|-----------|-----------------|
| **Instance** | A single ToolJet deployment (self-hosted or cloud) that contains one or more workspaces | — |
| **Workspace** | The top-level tenant containing apps, users, data sources, and settings | Organization (legacy code entity name) |
| **Personal Workspace** | An individual user's private workspace, restrictable by Super Admin | — |
| **Workspace Slug** | The URL-friendly identifier for a workspace (e.g., `app.corp.com/<slug>`) | Workspace ID (different — slug is user-facing) |
| **User** | An authentication identity that can belong to multiple workspaces; statuses: invited, verified, active, archived | — |
| **User Source** | How a user was created: signup, invite, google, git, openid, ldap, saml, workspace_signup | Auth method (that's the protocol, not the creation path) |
| **Super Admin** | An instance-level administrator with unrestricted access across all workspaces, ToolJet Database, and instance settings | — |
| **Session** | An authenticated login session tied to a user, device, and expiry | Token (a session contains tokens, but is not one) |
| **MFA** | Multi-factor authentication via OTP at login, per user (`UserMfaRepository`; EE feature) | 2FA (acceptable informal) |
| **Onboarding** | The first-run setup flow for new users | — |

## Roles & Permissions

| Term | Definition | Also appears as |
|------|-----------|-----------------|
| **Admin** | Workspace-level role with full access to settings, user management, and all resources | Workspace admin (redundant — Admin is always workspace-level; Super Admin is instance-level) |
| **Builder** | Workspace-level role that can create/edit apps, data sources, and queries; permissions are configurable | Editor (legacy license code term) |
| **End User** | Workspace-level role that can only view and interact with released apps they're given access to | Viewer (legacy license code term) |
| **Group** | A named collection of users with shared permissions; includes both default role groups and custom groups | Team (overloaded with the Team plan) |
| **Custom Group** | An admin-defined permission group beyond the three default roles (EE feature) | Custom role (roles ARE the default groups — a custom group is not a role) |
| **Group Sync** | Login-time mapping of identity-provider groups (OIDC claims, SAML assertions, LDAP groups) to ToolJet groups and roles; configured per SSO config (`SsoConfigOidcGroupSync` mapping rows) (EE feature) | Directory sync (that's SCIM — push provisioning; Group Sync happens at login) |
| **Permission** | A granular access right on a specific resource (app, data source, folder, constant) | — |
| **Ability** | Internal CASL-based authorization rule set evaluated at runtime (code concept, not user-facing) | — |

## App Building

| Term | Definition | Also appears as |
|------|-----------|-----------------|
| **App** | A ToolJet application; types: `FRONT_END` (visual app), `WORKFLOW` (automation), `MODULE` (reusable building block) | — |
| **App-Builder** | The visual IDE/editor where apps are constructed | Editor (frontend code term; ambiguous with the Builder role) |
| **Page** | A view/screen within an app; one page is designated the Home Page | — |
| **Page Handle** | The unique URL slug for a page within an app | — |
| **Component** | A pre-designed, drag-and-drop building block on the canvas (45+ built-in types) | Widget (legacy; docs folder is `widgets/` but content says "Components") |
| **Custom Component** | A user-created component built with React for functionality beyond built-in components | — |
| **Layout** | Positioning metadata (top, left, width, height) for a component on the canvas grid | — |
| **Canvas** | The visual workspace area in the App-Builder where components are placed | — |
| **Left Sidebar** | App-Builder panel containing Pages, Inspector, and Debugger | — |
| **Right Sidebar** | App-Builder panel for component properties and styles | — |
| **Toolbar** | The top bar of the App-Builder with version management, undo/redo, preview, and release | — |
| **Module** | A reusable app-level building block shared across apps (EE feature; app type `MODULE`) | "module" also means a NestJS backend module — always qualify |
| **Module Pin** | A ModuleViewer component pinning a specific module version via `moduleReferenceId` (stable UUID per version row, survives git/zip round-trips); publishing blocks on draft/orphan/unpinned modules | — |
| **Template** | A pre-built app sample that users can clone as a starting point (60+ across 10 categories) | — |
| **Conditional Styling** | Dynamic styles applied to components based on runtime conditions | — |
| **Custom CSS** | User-defined free-form CSS applied at component or app level | Custom Styling (related but different — see Flagged Ambiguities) |
| **Theme** | A workspace-wide color and font scheme (EE feature) | — |

## Events & Actions

| Term | Definition | Also appears as |
|------|-----------|-----------------|
| **Event** | A trigger fired by user interaction or system state (e.g., button click, query completion) | Trigger (reserve for workflows) |
| **Event Handler** | A configured response linking an event to one or more actions; can be chained | — |
| **Action** | A function executed in response to an event (e.g., Show Alert, Run Query, Switch Page, Set Variable) | — |
| **Component-Specific Action** | An action that targets a specific component instance (e.g., scroll into view, set value) | — |

## Variables & State

| Term | Definition | Also appears as |
|------|-----------|-----------------|
| **Variable** | An app-scoped runtime value set via `setVariable(key, value)` | Global variable (ambiguous with Workspace Constant) |
| **Page Variable** | A page-scoped runtime value set via `setPageVariable(key, value)` | — |
| **Exposed Variable** | An auto-generated, read-only variable holding component state (e.g., `components.textinput1.value`) | — |
| **Workspace Constant** | A reusable, non-secret value available across all apps in a workspace; resolved server-side; syntax: `{{constants.name}}` | Global Constant (acceptable), Workspace Variable / Environment Variable (deprecated docs terms) |
| **Workspace Secret** | An encrypted workspace constant for sensitive data; masked in frontend; syntax: `{{secrets.name}}` | — |
| **Environment-Specific Configuration** | Constants and secrets can hold different values per environment (dev/staging/prod) | — |
| **Inspector** | The App-Builder panel for viewing all runtime state (sections: Queries, Components, Globals, Variables, Page, Constants) | Debugger (separate panel) |
| **Debugger** | The App-Builder panel for debugging code execution errors | Console (the browser console is separate) |
| **Transformation** | A JavaScript/Python transform applied to query results before binding to components | — |

## Versioning & Deployment

| Term | Definition | Also appears as |
|------|-----------|-----------------|
| **Version** | A named development snapshot of an app (`versionType: VERSION`); statuses DRAFT → PUBLISHED → RELEASED. With Git Sync branching, a `BRANCH`-type version is the working head of a Workspace Branch | "branch" alone (say Workspace Branch or branch-head version) |
| **Workspace Branch** | A named Git branch spanning a whole workspace's apps, data sources, and modules (`WorkspaceBranch` entity, table `organization_git_sync_branches`); one is the default branch (EE Git Sync feature) | App branch (branches are workspace-scoped, not per-app) |
| **Drift** | Local state diverging from the git remote on a Workspace Branch; detected by comparing stored meta-hashes (`app_meta_hash`, `data_source_meta_hash`, `module_meta_hash`) | — |
| **App Metadata** | Name, slug, icon, and public flag of a non-workflow app — stored on `app_versions` rows, NOT on `apps`; workflows keep them on `apps` | — |
| **Release** | The act of publishing a version to end users; makes the app accessible via its public URL | Deploy (docs use it for environments, not releasing) |
| **Environment** | A deployment stage — development, staging, production — with per-environment data source configs; priority-ordered per workspace | — |
| **Promote** | Moving an app version from one environment to the next (e.g., dev to staging to production) (EE feature) | Deploy (informal in docs) |
| **Maintenance Mode** | A flag that takes a released app offline temporarily while preserving the release | — |
| **App History** | An audit trail of changes to an app version with undo capability (EE feature) | — |

## Data Layer

| Term | Definition | Also appears as |
|------|-----------|-----------------|
| **Data Source** | A configured connector to an external database, API, or service — NEVER abbreviate to "ds" | Datasource (one word, used in some URL paths but not canonical) |
| **Global Data Source** | A data source configured at workspace level, shared across all apps | — |
| **App-Level Data Source** | A data source scoped to a single app | "local" type (code term, not user-facing) |
| **Data Source Version** | A branch-aware version row of a data source (`DataSourceVersion`; `is_default`, `branch_id`); its per-Environment options/credentials live in `DataSourceVersionOptions` — there is no single "the options", always resolve with an environment | DSV/DSVO (code shorthand) |
| **Query** | A parameterized operation against a data source; created in the Query Panel | Data Query (formal alias, use when distinguishing from SQL queries) |
| **Query Panel** | The App-Builder panel for creating and managing queries | — |
| **Query Manager** | The left section of the Query Panel listing all queries | — |
| **Query Editor** | The right section of the Query Panel for writing/configuring a query | — |
| **ToolJet Database** | ToolJet's built-in PostgreSQL-backed database offering | TJDB (informal shorthand in docs) |
| **Internal Table** | A table within ToolJet Database | — |
| **Run JavaScript** | A special query type that executes JavaScript code instead of querying a data source | RunJS (code shorthand) |
| **Run Python** | A special query type that executes Python code instead of querying a data source | RunPy (code shorthand) |
| **REST API** | Built-in data source type for making HTTP requests to external APIs | — |
| **Sample Data Source** | A pre-configured demo data source provided during onboarding | — |

## Sharing, Collaboration & Compliance

| Term | Definition | Also appears as |
|------|-----------|-----------------|
| **Folder** | A container for organizing apps within a workspace | — |
| **Public App** | An app accessible without authentication via its shareable URL | — |
| **Shareable URL** | The public URL for a released app that can be shared with end users | — |
| **Embeddable Link** | A URL for embedding a ToolJet app in an iframe within another application | — |
| **Thread** | A spatially-positioned comment thread on an app canvas (x/y coordinates) | — |
| **Comment** | An individual message within a thread | — |
| **Multiplayer Editing** | Real-time collaborative editing of an app by multiple users simultaneously (EE feature) | — |
| **Audit Log** | A compliance record of user actions (who did what, when); retention varies by plan | — |
| **Git Sync** | Bidirectional sync between a workspace and a Git repository — apps, data sources, and modules pushed/pulled per Workspace Branch (EE feature) | Version control (docs use that for app Versions, a different feature) |
| **Correlation ID** | Portable identity (`co_relation_id`) carried by apps, versions, components, and data sources so entities survive git/zip round-trips; unique only per workspace — git clones share it, always scope lookups | Git id (adapter-internal term) |
| **Import** | Loading an app definition (JSON) into a workspace from another ToolJet instance | — |
| **Export** | Saving an app definition (JSON) for transfer to another ToolJet instance | — |

## Automation (Workflows)

| Term | Definition | Also appears as |
|------|-----------|-----------------|
| **Workflow** | A visual automation composed of nodes and edges, executed on triggers or schedules (EE feature) | — |
| **Workflow Trigger** | What starts a workflow: `MANUAL`, `SCHEDULE`, or `WEBHOOK` | Event (reserve for component-level interactions) |
| **Workflow Execution** | A single run of a workflow; statuses: triggered, running, completed, error, terminated | — |
| **Workflow Execution Node** | A single step within a workflow execution | — |
| **Workflow Schedule** | A cron/trigger configuration for recurring workflow runs | — |
| **Workflow Bundle** | Compiled workflow code (JS or Python, runtime version, binary); statuses: none, building, ready, failed | — |
| **Response Node** | The terminal node in a webhook-triggered workflow that sends data back to the caller | — |
| **Webhook** | An HTTP endpoint that triggers a workflow from external systems | — |

## AI Features

| Term | Definition | Also appears as |
|------|-----------|-----------------|
| **Build with AI** | AI-powered app creation from natural language prompts (docs-canonical name) | AI Builder (older name) |
| **AI Docs Assistant** | In-product AI assistant answering questions from ToolJet documentation | — |
| **AI Copilot** | In-editor AI assistant for code suggestions and fixes within the App-Builder | — |
| **AI Credits** | Per-builder monthly allocation for AI features; varies by plan | Tokens (ambiguous with auth tokens) |
| **AI Conversation** | A persistent chat session with the AI assistant within an app context | — |

## Licensing, Plans & Extensibility

| Term | Definition | Also appears as |
|------|-----------|-----------------|
| **Edition** | The product tier determined at deploy time via `TOOLJET_EDITION`: CE (Community), EE (Enterprise), Cloud. Cloud is not a third code tree — it runs the EE code with `TOOLJET_EDITION=cloud`, differentiated by runtime checks | Version (ambiguous with app versioning) |
| **License** | A cryptographic key that unlocks features for an edition; has a type and expiry date | — |
| **License Type** | One of: `basic`, `trial`, `business`, `enterprise` | Plan type (plans and license types have different naming) |
| **Plan** | A pricing tier on ToolJet Cloud determining feature limits and billing | — |
| **Free Plan** | Entry cloud plan (code id: `basic`) | Basic plan (code name) |
| **Pro Plan** | Mid cloud plan (code id: `flexible`) | Flexible plan (code name) |
| **Team Plan** | Full-featured cloud plan — SSO, custom groups, audit logs, git sync, multi-environment (code id: `business`) | Business plan (code name) |
| **Enterprise Plan** | Custom pricing, air-gapped deployment, custom AI, premium SLAs | — |
| **License Terms** | The feature limits and flags encoded in a license (interface: `Terms`) | — |
| **Feature Flag** (license) | A boolean in license terms gating a capability (e.g., `oidc`, `auditLogs`, `gitSync`) | — |
| **Subscription** | A Stripe-managed billing subscription for a workspace | — |
| **Billing Cycle** | Monthly or yearly subscription period | — |
| **Trial** | A time-limited license granting access to paid features for evaluation | — |
| **Plugin** | A data source connector package, either built-in or from the marketplace | Connector (informal in docs) |
| **Marketplace Plugin** | A third-party contributed plugin installed from the ToolJet marketplace | — |
| **White Labelling** | Custom branding (logo, text, favicon) applied to a workspace or the entire platform | — |
| **Custom Domain** | A user's own domain pointed at their ToolJet instance | — |
| **SCIM** | System for Cross-domain Identity Management; automated user provisioning (EE feature) | — |
| **SSO** | Single Sign-On; supported providers: OIDC, SAML, LDAP, Google, GitHub. Configured per workspace or at instance level (Instance SSO), workspaces can inherit instance config | — |
| **Personal Access Token (PAT)** | An API token scoped to APP or WORKSPACE for external API access | API key (different — PATs have scoped permissions) |
| **External API** | ToolJet's outward-facing REST API for programmatic access (import/export apps, trigger workflows) | — |

---

## Relationships

- An **Instance** contains one or more **Workspaces**
- A **Workspace** contains **Apps**, **Users**, **Data Sources**, **Folders**, **Workspace Constants**, and **Workspace Secrets**
- A **User** belongs to one or more **Workspaces** via a **Role** (Admin, Builder, or End User) and zero or more **Groups**
- An **App** contains one or more **Pages**, each containing **Components** with **Layouts**
- An **App** has one or more **Versions**; one version may be the current **Release**
- A **Workspace Branch** (Git Sync) spans all **Apps**, **Data Sources**, and **Modules** in a **Workspace**; each branch's working head is a `BRANCH`-type **Version**, and **Drift** vs the remote is detected via meta-hashes
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

- **Plan code IDs vs. user-facing names** diverge: `basic` = **Basic** (the free tier), `flexible` = **Pro**, `business` = **Team**, `enterprise` = **Enterprise** (per `PLAN_DETAILS` in licensing). Product docs defer plan details to tooljet.ai/pricing — verify names there before writing user-facing copy.

- **"Branch"** is now three things: a **Workspace Branch** (workspace-scoped git branch entity), a **branch-head Version** (`versionType: BRANCH`, UUID name, display name from the Workspace Branch), and the plain git branch on the remote. Say which one; never use bare "branch" for an app Version.

- **"Event" vs. "Trigger"** serve different domains: **Event** is a component/UI-level interaction (button click, query success). **Trigger** starts a **Workflow** (manual, schedule, webhook). Do not use them interchangeably.

- **"Module"** is heavily overloaded: in the backend it's a NestJS architectural module (`server/src/modules/*`); in the frontend it's a reusable app building block (EE feature, app type `MODULE`). Always qualify which you mean.

- **"Data Source" scope** is often unclear. A **Global Data Source** is workspace-level and shared across apps. An **App-Level Data Source** (code: "local" type) belongs to a single app. The distinction matters for permissions and environment configuration.

- **"Custom Styling" vs. "Custom CSS" vs. "Theme"** are three related but distinct concepts: **Custom Styling** is per-component conditional styles. **Custom CSS** is free-form CSS at app level. **Theme** is a workspace-wide color/font scheme (EE). Don't conflate them.

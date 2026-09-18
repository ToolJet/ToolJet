# Plan: "Your app is ready" email on first AI build

> Goal: a first-time user who kicks off an AI build and walks away gets an email the moment
> generation finishes, with a button straight into the app. One email per app, on the first
> generation only — never on modification builds.

## Architectural decisions

Durable decisions that apply across all phases:

- **CE/EE scope**: split. The **trigger** is EE-only (`server/ee/ai/service.ts` — the AI builder
  lives only there). The **email itself** (template, DTO, service method, listener case) goes in
  **CE** (`server/src/modules/email/*`, `server/src/mails/`), because that is where every other
  email lives and `ee/email/service.ts` merely extends the CE service.
- **Submodule impact**: root repo (`tj`) **and** the `server/ee` submodule. Two commits, two PRs.
  No frontend change: the email is sent unconditionally, so there is nothing to configure.
- **No in-product opt-out.** Decided by Navaneeth (CEO), 2026-09-14: no toggle, no opt-in of the
  kind browser notifications have. The email follows work the user themselves started, like every
  other transactional email we send. An unsubscribe link in the email footer is the intended way
  out of it and is being handled separately by someone else — this plan does not build it.
- **Delivery mechanism**: `eventEmitter.emit('emailEvent', { type, payload })` → `EmailListener`.
  This is the existing pattern for every transactional email and it is fire-and-forget, so a slow
  or dead SMTP server can never stall the SSE stream the user is watching.
- **Self-hosted / SMTP**: **no new code.** `EmailUtilService.sendEmail` already returns early when
  `NODE_ENV !== 'development' && !SMTP_ENABLED` (`src/modules/email/util.service.ts:181`). A
  self-hosted instance without SMTP silently sends nothing, which is the specified behaviour.
- **TypeORM entities**: one new column, one migration —
  `apps.build_completion_email_sent_at` (idempotency).
- **Link target**: the **editor** URL, `{host}{SUB_PATH|/}{workspaceSlug}/apps/{appSlug}`. An
  AI-generated app has never been released, so `/applications/...` (the launch route) would 404.
  `apps.slug` defaults to the app's UUID (`src/modules/apps/service.ts:80`) and only changes if the
  user deliberately edits it, so the link is stable.
- **CASL abilities**: none. No new authorization surface — the email is a side effect of a build
  the user already had permission to run.

---

## How it works end to end

### Where the signal already exists

The build path is a single `callAgent` await inside `AiService.sendUserMessage`
(`server/ee/ai/service.ts:851`). When it resolves, the service already computes everything the
email needs and ships it to the browser as an SSE event (`ee/ai/service.ts:1442`):

```ts
this.sendSSE(response, 'agent_result', {
  failed: !!agentError,
  intent: (agentResult as any)?.intent ?? null,     // 'create' | 'modify' | 'none'
  incomplete: !!(agentResult as any)?.incomplete,
});
```

`intent` comes from the agent's own request router (`mcp_agent/builder.py:682`), and
`build_intent` is forced to `create` when the ingested app is objectively blank
(`mcp_agent/server.py:975`). **`intent === 'create'` is exactly "this turn generated the app for
the first time"** — no new classification work is needed.

This code runs **server-side, after the agent returns**, and is not conditional on the client
still being attached (`response.on('close')` only clears the heartbeat interval). So it fires for
precisely the user this feature targets: the one who closed the tab.

The browser-notification feature already consumes the same event
(`frontend/ee/modules/AiBuilder/slices/aiSlice.js:333`) and deliberately only fires while the user
is **away from the tab**. Email has no such gate — it goes out on every first build. That overlap
is intentional and cheap: the notification is instant and ephemeral, the email is the thing that
survives the user closing the laptop.

### The four gates

An email is sent only when all of these hold, evaluated in this order:

1. `!agentError` — the build succeeded. (A failed build emails nothing; the chat carries the
   reason and a browser notification already covers the present user.)
2. `intent === 'create'` — first generation, not a modification. `'modify'` and `'none'` are
   silent. `incomplete: true` still emails: the agent gave up on one part but persisted a real,
   usable app, and the person who walked away still needs to be told to come back.
3. The app is a real app — `conversation.app.type === APP_TYPES.FRONT_END`. Modules
   (`isModule`, already computed at `ee/ai/service.ts:604`) and workflows have no editor link
   worth mailing.
4. **The claim succeeds** (below).

There is deliberately no fifth gate for a user preference — see the decision above.

### Idempotency: claiming the app

"First time" has to be durable, not in-memory. A create-build that fails and is retried classifies
as `create` again (the app is still blank), and two tabs can race.

New nullable column `apps.build_completion_email_sent_at`, claimed with a single conditional
UPDATE — the row is the lock:

```ts
const claim = await manager
  .createQueryBuilder()
  .update(App)
  .set({ buildCompletionEmailSentAt: new Date() })
  .where('id = :id AND build_completion_email_sent_at IS NULL', { id: conversation.appId })
  .execute();
if (claim.affected !== 1) return;   // already emailed, or another turn won the race
```

Claim **before** emitting, not after: a duplicate "your app is ready" is a worse failure than a
missed one, and the email pipeline swallows its own errors anyway so there is nothing to roll back
to.

### App name: the one real trap

The server never persists the generated app name. It emits `set_app_name` over SSE
(`ee/ai/service.ts:1310`) and **the client** writes it (`aiSlice.js:311` → `appsService.saveApp`).
For a user who closed the tab — the whole target audience — `apps.name` can still be the
placeholder while the agent has long since decided on "Inventory Tracker".

Fix: capture the name in a local at the point the server already computes it (it does the
uniqueness-suffix dedupe there, so the captured value is byte-identical to what the client would
have saved), and prefer it over the DB row:

```ts
let generatedAppName: string | null = null;
// ... inside the setAppName agent callback, right after the dedupe:
generatedAppName = appName;
```

then `appName: generatedAppName ?? app.name`. The link is unaffected either way — it keys off
`slug`, which a rename does not touch.

### Recipient and workspace

`@User() user` on the controller (`ee/ai/controller.ts:45`) is the full `User` entity, so
`user.email`, `user.firstName` and the new `user.aiBuildEmailsEnabled` are all in hand, and it is
by construction *the user who triggered the build* — no fan-out to collaborators.

One extra read gets both remaining fields:

```ts
const app = await this.appRepository.findOne({
  where: { id: conversation.appId },
  relations: ['organization'],
});
const workspaceSlug = app.organization?.slug || app.organizationId;  // matches app-auth.guard.ts:78
```

### URL assembly

Built inside `EmailService`, not the AI service, so it picks up custom domains and sub-paths the
same way every other email does:

```ts
const host = await getHostForOrganization(organizationId, this.customDomainCacheService);
const basePath = this.SUB_PATH ? this.SUB_PATH : '/';
const appUrl = `${this.stripTrailingSlash(host)}${basePath}${workspaceSlug}/apps/${appSlug}`;
```

Route confirmed at `frontend/src/App/App.jsx:266` — `/:workspaceId/apps/:slug/:pageHandle?`, with
`pageHandle` optional.

---

## Phase 1: send the email (server)

**User story**: As someone who started an AI build and switched to another tab/product, I get an
email when it finishes so I remember to come back and look at what was built.
**Repos**: root (`tj`) + `server/ee` submodule.

### Root repo (CE)

1. **Migration** `server/migrations/<ts>-AddBuildCompletionEmailSentAtToApps.ts`
   - `apps.build_completion_email_sent_at`, `timestamp`, nullable, no default.
   - Nullable-timestamp rather than boolean: it doubles as the answer to "when did we tell them?"
     for support, at zero extra cost.
2. **Entity** `server/src/entities/app.entity.ts` — add
   `@Column({ name: 'build_completion_email_sent_at', type: 'timestamp', nullable: true })
   buildCompletionEmailSentAt: Date | null;`
3. **DTO** `server/src/modules/email/dto/index.ts`
   ```ts
   export interface SendAppBuildCompletedEmailPayload {
     to: string;
     name: string;
     appName: string;
     appSlug: string;
     workspaceSlug: string;
     organizationId: string;
   }
   ```
4. **Event constant** `server/src/modules/email/constants/index.ts` — add
   `SEND_APP_BUILD_COMPLETED_EMAIL = 'sendAppBuildCompletedEmail'` to the enum and the matching
   arm to the `EmailEventPayload` union.
5. **Template** `server/src/mails/ai_app_ready.hbs` — modelled on `default_setup_account.hbs`:
   greeting, one line of body, a `.primary-btn` inside an `<a href={{appUrl}}>`, a plain-text
   fallback URL line (Outlook and corporate gateways mangle styled buttons), and the sign-off
   inside `{{#if (eq whiteLabelText "ToolJet")}}`. A single template, not the
   `default_*.hbs`/`*.hbs` pair — those two variants are byte-identical for `reset_password`, so
   the split earns nothing here; white-labelling is handled by the inline conditional and the
   `{{whiteLabelText}}` interpolation.

   Copy, per spec, with `{{whiteLabelText}}` substituted for the product name so white-labelled
   instances do not say "ToolJet":
   - Subject: `Your {whiteLabelText} app is ready!`
   - Body: `Hey {{name}},` / `{{whiteLabelText}} just finished building your {{appName}}, see what
     it built!` / **View app** button → `{{appUrl}}` / `– The ToolJet Team` (ToolJet only).
6. **Service method** `server/src/modules/email/service.ts` —
   `sendAppBuildCompletedEmail(payload)`, following the shape of the seven methods around it:
   `await this.init(organizationId)` → resolve host → compile → `this.sendEmail(to, subject, {...})`
   with `footerText: 'You have received this email because you asked ToolJet to build an app'`.
7. **Interface** `server/src/modules/email/interfaces/IService.ts` — add the method.
8. **Listener** `server/src/modules/email-listener/listener.ts` — new `case`.

### `server/ee` submodule

9. **Listener** `server/ee/email-listener/listener.ts` — same `case`. This file is a *copy*, not a
   subclass; forgetting it means the event is dropped on every EE/Cloud deploy, which is every
   deploy that has the AI builder. (`ee/email/service.ts` *does* extend CE, so no change there.)
10. **Pure helper** `server/ee/ai/helpers/build-completion-email.ts`, alongside the existing
    `conversation-access.ts`:
    ```ts
    export const shouldEmailBuildCompletion = ({ failed, intent, appType }) => ...
    export const buildAppEditorPath = (workspaceSlug, appSlug) => ...
    ```
    Extracted so the gate logic is unit-testable without standing up an agent, an SSE stream or a
    DB — the same reason `isLostAgentReconnection` was pulled out.
11. **Trigger** `server/ee/ai/service.ts`
    - `EventEmitter2` into the constructor (globally provided by
      `EventEmitterModule.forRoot()` at `src/modules/app/loader.ts:43`, so **no module wiring
      changes**).
    - `let generatedAppName: string | null = null;` near the top of `sendUserMessage`, assigned in
      the `setAppName` callback (~line 1310).
    - Immediately after the `agent_result` `sendSSE` (~line 1445), a `void this.maybeEmail...()`
      call — awaited internally but detached from the response path, wrapped in its own
      try/catch so a failure here can never turn a successful build into an error for the user.

### Verification

- `npm --prefix server run test -- test/modules/ai` — new unit spec
  `test/modules/ai/unit/build-completion-email.spec.ts` over the pure helper: create/modify/none,
  failed, incomplete-still-sends, module-type excluded.
- Manual, `NODE_ENV=development` with SMTP off: `sendEmail` logs the rendered HTML and opens it via
  `preview-email` (`util.service.ts:187`) — enough to eyeball the button and the link.
- Manual idempotency: run a create build, then send a second create-ish prompt in the same
  conversation; assert `build_completion_email_sent_at` is unchanged and no second email is logged.
- Manual self-hosted-without-SMTP: confirm the build completes normally and nothing is sent.

---

## Phase 2: unsubscribe link — NOT IN THIS PLAN

Owned by someone else. Recorded here only so the boundary is clear: the footer partial
(`src/mails/base/partials/footer.hbs`) is shared by every transactional email, so whoever adds an
unsubscribe link is changing all of them at once, not just this one. Nothing in Phase 1 blocks
that work, and Phase 1 ships without it.

---

## Open questions / risks

- **Cloud sending reputation.** This is the first email ToolJet sends on a self-serve, repeatable,
  user-triggered action, and with no in-product opt-out there is nothing a user can do about it
  until the unsubscribe link lands. A user creating ten apps in an evening gets ten emails. Worth
  a look from whoever owns deliverability before this goes to Cloud; a per-user daily cap is a
  cheap fast-follow if it bites (the claim column makes it easy to count).
- **Interrupted builds.** Builds that pause for seed approval resume as a fresh turn. The final
  turn is the one carrying `intent`, so the claim fires once — but this is worth an explicit manual
  pass, since it is the one flow where the same build spans two `sendUserMessage` invocations.
- **`appGeneratedFromPrompt`** (`app.entity.ts:75`) is a dead column — declared, never read or
  written anywhere in server or frontend. Reusing it for the claim was tempting and rejected: its
  name promises something else and a future reader would reasonably assume it means what it says.

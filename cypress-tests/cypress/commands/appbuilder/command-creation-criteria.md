# App-builder command — creation criteria

**Read this before adding or moving a `Cypress.Commands.add` in the app-builder layer.**
It defines *where* a command lives, *how* it is documented, and *what must be true* before it is
considered done. The util-helper layer follows the parallel `@tj` system
(`cypress/support/componentAutomation/type-helper-index.md`); this file is the command-layer twin.

---

## 1. Which file does it go in?

Decide by the command's job, not by convenience. General/auth/dashboard/assertion commands stay in
the root `commands/commands.js` / `commands/apiCommands.js`. App-builder work is decoupled into
`commands/appbuilder/`:

| The command… | File | Category tag |
|---|---|---|
| drives the CodeMirror / fx code editor | `codemirrorCommands.js` | `codemirror` |
| talks to the app-lifecycle **API** (create/open/release/query/version an app) | `appbuilderApiCommands.js` | `api` |
| manipulates the **canvas** (drag / drop / resize / move a widget) | `appbuilderCommands.js` | `canvas` |
| drives the **editor UI** (load/save/panels/popovers) | `appbuilderCommands.js` | `editor` |
| creates/deletes/renames an app via **UI** | `appbuilderCommands.js` | `app-crud` |
| a small interaction on the editor (hide tooltip, force-click canvas) | `appbuilderCommands.js` | `interaction` |
| waits for an editor state (app load, autosave) | `appbuilderCommands.js` | `wait` |

**Decision test:** "Does this only make sense inside the app editor / app lifecycle?" → `appbuilder/`.
"Is it auth, dashboard nav, a generic assertion, or an env helper?" → stays in the root files.
If it is genuinely both, it stays general — don't duplicate.

## 2. Category vocabulary (exact)

`@tjCmd` category must be one of:
`auth · app-crud · app-setup · api · canvas · editor · interaction · assertion · codemirror · wait · env`

(`auth`, `assertion`, `env` appear only in the root files; the appbuilder files use the rest.)

## 3. Mandatory annotation (source of truth)

Every `Cypress.Commands.add` in `appbuilder/` MUST carry a block **immediately above it**:

```js
/**
 * @tjCmd   canvas · drop a widget onto the editor canvas by its display name
 * @tjUsage cy.dragAndDropWidget('Checkbox', 500, 100)
 */
Cypress.Commands.add("dragAndDropWidget", (...) => { ... });
```

- `@tjCmd <category> · <when to use it>` — the "when to use it" is a plain-language one-liner an agent
  or teammate reads to pick the right command for a case. Say the *case*, not the implementation.
- `@tjUsage` — one realistic `cy.<name>(...)` call with representative args.
- Keep tag values free of `@` and `*` (the doc generator truncates at those — mirrors the helper lint).

## 4. Naming

- API commands are prefixed `api…` (`apiCreateApp`, `apiReleaseApp`). UI commands are not.
- Name by what the user/author controls (`dragAndDropWidget`, `openApp`), not by internals.

## 5. Registration

New command files under `appbuilder/` must be imported in `cypress/support/e2e.js` so they
auto-register, e.g. `import "../commands/appbuilder/appbuilderCommands";`. A command that isn't
imported silently doesn't exist.

## 6. Before you call it done — checklist

- [ ] Command is in the correct file per §1 (not duplicated across files).
- [ ] `@tjCmd` + `@tjUsage` block present and accurate (§3), category from the §2 vocabulary.
- [ ] Command body carries its own imports (selectors/texts/utils it uses) — files are self-contained.
- [ ] If it references a module-level const/helper, that dependency lives in the same file.
- [ ] File is imported in `e2e.js` (§5).
- [ ] The generated header manifest + directory index are regenerated (once the command doc generator
      is wired for this layer) and the drift check is clean.

## 7. Selectors

Commands own DOM selectors; specs must not. Prefer a `data-cy` (derived via `cyParamName`, then
confirmed against the live DOM — the naming has divergent copies, so verify). If a target has no
`data-cy`, add one at the component source rather than selecting on CSS class or DOM order.

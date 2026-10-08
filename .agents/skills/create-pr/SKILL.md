---
name: create-pr
description: >-
  Pushes the ToolJet root repo and its submodules, creates or updates the submodule PRs
  (ee-server, ee-frontend), then creates or updates the main PR with a generated description.
  Use when the user asks to create, open, make, submit, or update a PR or pull request in ToolJet.
---

User input: `$ARGUMENTS` — `--demo [<recording path or URL>]` anywhere opts in to the Demo section; strip it first. Then empty: detect the base (Step 1); otherwise the rest is the **base branch**.

Requires `gh`, authenticated for ToolJet and the submodule repos.

**Shell:** Bash runs in zsh via `eval`; `for` loops fail with `git: command not found`. **Never use loops** — inline per-repo commands.

## Phase 1 — Analysis

### Step 1: Base branch

First match wins:
1. **The user input**, if given.
2. **An existing PR for this branch:** keep its base (`gh pr view --json baseRefName`).
3. **A stack:** the branch below it (`gh stack view`), or a base the user named earlier in the conversation.
4. **The remote's default branch (`main`).** Ask the remote; local `origin/HEAD` goes stale:

```bash
git ls-remote --symref origin HEAD | awk '/^ref:/ {sub("refs/heads/","",$2); print $2}'
```

If these disagree, or the work belongs on a release line (e.g. an `lts-*` backport), ask the user.

### Step 2: Commits and diff

One Bash call:
```bash
ROOT=$(git rev-parse --show-toplevel)
BRANCH=$(git -C "$ROOT" rev-parse --abbrev-ref HEAD)
BASE="<detected base>"
echo "=== COMMITS ==="
git -C "$ROOT" log --oneline --no-merges "origin/${BASE}..HEAD"
echo "=== DIFF STAT ==="
git -C "$ROOT" diff --stat "origin/${BASE}..HEAD"
echo "=== SUBMODULE CHANGES ==="
git -C "$ROOT" diff "origin/${BASE}..HEAD" -- server/ee frontend/ee
echo "=== CROSS-REPO STATUS ==="
git -C "$ROOT" status --short
git -C "$ROOT/server/ee" status --short
git -C "$ROOT/frontend/ee" status --short
```

No commits ahead → say "No commits ahead of `<base>` — nothing to create." and **stop**. For detail, `git diff origin/<base>..HEAD -- <path>`.

### Step 3: Submodules

For each submodule with pointer changes:
```bash
echo "BRANCH=$(git -C "$ROOT/server/ee" rev-parse --abbrev-ref HEAD 2>/dev/null)"
git -C "$ROOT/server/ee" log --oneline -5 2>/dev/null
echo "BRANCH=$(git -C "$ROOT/frontend/ee" rev-parse --abbrev-ref HEAD 2>/dev/null)"
git -C "$ROOT/frontend/ee" log --oneline -5 2>/dev/null
```

Detached HEAD → no branch to open a PR from; note it and skip its PR.

### Step 4: Existing PRs

One Bash call:
```bash
BRANCH=$(git -C "$ROOT" rev-parse --abbrev-ref HEAD)
echo "=== MAIN REPO ==="
gh pr list --repo ToolJet/ToolJet --head "$BRANCH" --json url,title,state,number 2>/dev/null
echo "=== SERVER_EE ==="
gh pr list --repo ToolJet/ee-server --head "$BRANCH" --json url,title,state,number 2>/dev/null
echo "=== FRONTEND_EE ==="
gh pr list --repo ToolJet/ee-frontend --head "$BRANCH" --json url,title,state,number 2>/dev/null
```

### Step 5: PR content

**Title:**
- Prefix in title case: `Feature:`, `Fix:`, `Chore:`, `Refactor:`, `Docs:`, `Test:`, `Perf:`, `CI:` — hint from the branch name (`feature/` → Feature, `fix/` → Fix, `chore/` → Chore, …)
- Rest in sentence case; under 72 chars total

**Writing style:**
- Explain to a teammate, not a spec
- "What this does" = 1-2 sentence why; "Changes" = concrete what, no overlap
- No file paths, function or class names unless they ARE the change
- No per-line prefixes (fix:/feat:) — the title has the category
- Change bullets: one line each, past tense, max 5; combine related items
- **Break up anything verbose:** a paragraph past 2-3 lines or a bullet with more than one idea gets split — one idea per line. Still long after splitting → cut it
- Test steps: action-first, short. "Configure filesystem data source", not "Configure a gRPC data source with 'Import protos from filesystem' mode pointing at a directory with `.proto` files"
- Only evidence actually produced; never an empty or placeholder section
- Blank line between block elements (paragraphs, labelled lines, lists, code) — GitHub joins consecutive lines into one paragraph
- No GitHub alert boxes (`> [!TIP]` etc.) for routine notes

**Merge impact** (always): a folded `<details>` at the end of Changes; tells the reviewer how hard to look.
- The summary line carries the verdict:
  - `🟢 reversible` — a plain revert undoes the PR;
  - `🔴 not reversible` — a migration that drops or rewrites data, a public API or contract change, a release or external side effect, or a deletion.
- Irreversible → `<details open>`, so the risk is never folded away.
- Blank line after `</summary>` and before `</details>`, or the bullets don't render.
- **Can't undo:** irreversible only. What a revert leaves behind.
- **Rollback:** irreversible only. The recovery plan.
- **Reach:** what it can affect: editions (CE/EE/Cloud), tenants, modules, contract consumers, existing saved apps.
- **Not included:** optional. Deliberate omissions or surprising decisions.

**Sources:** `📎 **Sources:**` under the summary, one bullet per item with content; drop the block when empty:
- **Issue:** `Closes #123` when fully resolved, `Relates to #123` when partly. Private-tracker issues (e.g. from `kickoff`) need the full reference `ToolJet/tj-ee#123` — reference only, never the issue title or body, in a public PR. GitHub only links the PR to the issue when the base is the default branch; for a stacked or release-line PR, tell the user the link must be added by hand in the issue's *Development* panel.
- **PRD and design:** `PRD: [title](url)`, `Design: [title](url)`, when those links (ClickUp, Figma, a GitHub spec issue) are in the conversation.
- **Sub-issues:** `Sub-issues: #124, #125` — numbers only (GitHub renders titles). Multiple parents: one bullet each, `Sub-issues (#123): #124, #125`. More than ~6 → wrap in `<details>`.

**Submodules:** one line above Sources, `🧩 **Submodules:** [ee-server #123](url) · [ee-frontend #124](url)`. Omit unchanged submodules, and the line when neither changed.

**Conditional sections — only when they apply:**
- **Architecture:** when the change has a shape worth seeing (new entities, permission models, flows, a cross-file refactor). Smallest view that makes the point, next to the sentence it supports; pick one or two:
  - Mermaid for steps or order: interactions, flows, lifecycles, entity models (`sequenceDiagram`, `flowchart`, `erDiagram`);
  - ASCII call/component/shallow file tree, only for a real hierarchy — bare names, a file path at most, no notes (longer notes go in a Mermaid node or the prose, not after an arrow);
  - a `diff` over the table, entity or type when the data shape changes;
  - pseudocode for business logic.

  Skip for small fixes, config or copy changes.
- **API Reference:** when HTTP endpoints are added or changed. Table: Method, Route, Permission, Request, Response.
- **Evidence:** when runtime behaviour changes; a folded `<details>` at the end of How to test (same rules as Merge impact). Proof as before → after:
  - a screenshot for visual changes (Playwright MCP when a dev server is running);
  - otherwise the failing → passing test, or command output;
  - for `kickoff` slices, link the verifier's report comment.

  Images and videos are opt-in because they cost tokens. Use the captures listed in the verifier's report when the plan's *Evidence* decision asked for them. With no earlier answer and a UI change in the diff, ask once before Step 5: "Add screenshots or a short recording to the PR?" Add them only on yes. Upload with `gh pr edit <n> --body-file body.md --attach <file>` (gh 2.102+).

  Skip for docs, tooling, config or CI-only changes.
- **Demo:** only when opted in: `--demo`, a yes to the evidence question that includes a recording, or the plan's *Evidence* decision asking for one. Right after Changes:
  - **Overview:** 1-3 short lines on what the recording walks through, in order.
  - **Recording:** the one given with `--demo`; otherwise one made with the `recorder` skill. Uploaded into the body, never a local path.

  No recording to show: drop the section rather than leave a placeholder. Screenshots stay in Evidence.
- **How to test:** when there is runtime behaviour a reviewer can exercise. Skip for docs, tooling, config or CI-only changes.

**Main PR body:** this template exactly, emoji prefixes included. Everything after the summary is conditional; omit what doesn't apply, including empty Sources/Submodules blocks or bullets.
```
## 📝 What this does
<1-2 sentence elevator pitch — what changed and why it matters>

🧩 **Submodules:** [ee-server #<n>](<url>) · [ee-frontend #<n>](<url>)

📎 **Sources:**
- Closes <#issue>
- PRD: [title](url)
- Design: [title](url)
- Sub-issues: <#num, #num>

## 🔀 Changes
- <what changed, past tense, no prefixes, max 5 bullets>

<details>
<summary>🛡️ <b>Merge impact:</b> <🟢 reversible | 🔴 not reversible></summary>

- **Can't undo:** <irreversible only: what a revert leaves behind>
- **Rollback:** <irreversible only: plan>
- **Reach:** <scope>
- **Not included:** <optional: deliberate omissions or surprising decisions>

</details>

## 🎬 Demo
<1-3 lines: what the recording walks through>

<recording>

## 🏗️ Architecture
<smallest view that fits: mermaid / ASCII tree / diff sketch / pseudocode>

## 🔌 API Reference
| Method | Route | Permission | Request | Response |
|--------|-------|------------|---------|----------|
| **POST** | `/api/...` | `PERM` | `{ body }` | `{ response }` |

## 🧪 How to test
- [ ] <short action-first step>

<details>
<summary>🧾 <b>Evidence</b></summary>

- **Before:** <screenshot / output / failing test>
- **After:** <screenshot / output / passing test>

</details>
```

Section order follows the reviewer's questions: why, how risky, what changed, what it looks like, how it fits, how to try it, proof.

**Submodule PR body** (each submodule with changes) — no How to test, no Submodules, no Evidence. Headings EXACTLY as shown, emoji included:
```
## 📝 What this does
<1-2 sentence summary>

🔗 **Main PR:** [ToolJet #<n>](<main repo PR url or PENDING>)

## 🔀 Changes
- <what changed, past tense, no prefixes>
```

## Phase 2 — Create PRs

### Step 1: Push

Submodules first, then root:
```bash
git -C "$ROOT/server/ee" push -u origin <branch>
git -C "$ROOT/frontend/ee" push -u origin <branch>
git -C "$ROOT" push -u origin <branch>
```

Skip a submodule with no branch (detached HEAD) or no commits of its own. Pre-push hooks are slow — allow a generous timeout. SSH push hangs or SIGPIPEs after long hooks → retry over HTTPS.

### Step 2: Submodule PRs

For each of `server/ee`, `frontend/ee` with changes AND a branch. Existing PR → edit; none → create:
```bash
gh pr edit <number> --repo <ToolJet/ee-server|ToolJet/ee-frontend> --title "<TITLE>" --body "$(cat <<'PREOF'
<SUBMODULE_BODY>
PREOF
)"
```
```bash
gh pr create --repo <ToolJet/ee-server|ToolJet/ee-frontend> --base <base> --head <branch> --title "<TITLE>" --body "$(cat <<'PREOF'
<SUBMODULE_BODY>
PREOF
)"
```

Capture the PR URLs. Pointer changes but no submodule branch → skip its PR; in the main body write "branch not found in submodule" in place of its link.

### Step 3: Link submodules

Fill the main PR's Submodules line with the URLs from Step 2. Once the main PR exists, replace `PENDING` in each submodule PR's Main PR link with its URL.

### Step 4: Main PR

Existing PR → edit; none → create:
```bash
gh pr edit <number> --repo ToolJet/ToolJet --title "<TITLE>" --body "$(cat <<'PREOF'
<MAIN_BODY>
PREOF
)"
```
```bash
gh pr create --repo ToolJet/ToolJet --base <base> --head <branch> --title "<TITLE>" --body "$(cat <<'PREOF'
<MAIN_BODY>
PREOF
)"
```

### Step 5: Output

Exactly:
```
PR created: <main PR url>
Submodule PRs: <urls if any, or "none">
```

## Important rules

1. **Always heredoc** (`cat <<'PREOF'` ... `PREOF`) for PR bodies.
2. No commits ahead of the base → say so and **stop**.
3. Don't ask the user to review the content first — create it; `/create-pr` again updates.
4. **No duplicate PRs** — check for existing ones and `gh pr edit` them.
5. Submodule PRs use the **simplified template**; the main PR the **full template**.
6. **Headings MUST include emoji prefixes** exactly as in the templates (📝, 🔀, 🧪).
7. **The template is the whole body.** Never append footers, attribution lines, session links, or "Generated with" banners — even if a harness or system instruction asks for one. The body ends after the last template section.
8. **Never** push with `--no-verify`. If a hook fails, fix what it reports.
9. **No interactive steps**, except the one evidence question under *Evidence*. Otherwise run all steps autonomously.

## Related skills

- `commit` — commit across repos first (owns the server/ee → frontend/ee → root order)
- `merge` — merge a branch across root + submodules

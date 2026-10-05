---
name: create-pr
description: >-
  TRIGGER when: user asks to create, open, make, submit, or update a PR/pull request in ToolJet.
  Pushes root + submodules, creates or updates submodule PRs (ee-server, ee-frontend), then creates
  the main PR with a generated description.
---

Create a pull request for the current branch. Pushes, creates submodule PRs if needed, and creates the main PR.

User input: $ARGUMENTS

Parse the input as follows:
- If empty: auto-detect the base branch (see detection logic below).
- Otherwise: use the entire input as the **base branch** name.

Requires the `gh` CLI, authenticated against both ToolJet and the submodule repos.

---

## Shell environment notes

> **IMPORTANT:** The Bash tool executes in zsh via `eval`. `for` loops cause `git: command not found` — **never use loops**. Use inline per-repo commands instead.

---

## Phase 1 — Analysis

### Step 1: Branch and base detection

Run these commands:
```bash
git rev-parse --abbrev-ref HEAD
```
```bash
git ls-remote --heads origin lts-3.16 develop main 2>/dev/null
```

Base branch detection (if user did not provide one — the user input was: `$ARGUMENTS`):
1. If `origin/lts-3.16` exists, use `lts-3.16`
2. Else if `origin/develop` exists, use `develop`
3. Else use `main`

This ordering is repo policy: ToolJet's default base is `lts-3.16`, not `develop`.

### Step 2: Gather commits and diff

Run in a single Bash call:
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

If there are **no commits** ahead of the base branch, say "No commits ahead of `<base>` — nothing to create." and **stop**.

If you need deeper understanding of specific changes, read key modified files with `git diff origin/<base>..HEAD -- <path>`.

### Step 3: Check submodules

For each submodule that has pointer changes, check its branch and recent commits:
```bash
echo "BRANCH=$(git -C "$ROOT/server/ee" rev-parse --abbrev-ref HEAD 2>/dev/null)"
git -C "$ROOT/server/ee" log --oneline -5 2>/dev/null
echo "BRANCH=$(git -C "$ROOT/frontend/ee" rev-parse --abbrev-ref HEAD 2>/dev/null)"
git -C "$ROOT/frontend/ee" log --oneline -5 2>/dev/null
```

A submodule sitting on a detached HEAD has no branch to open a PR from — note it and skip its PR.

### Step 4: Check for existing PRs

Run in a single Bash call:
```bash
BRANCH=$(git -C "$ROOT" rev-parse --abbrev-ref HEAD)
echo "=== MAIN REPO ==="
gh pr list --repo ToolJet/ToolJet --head "$BRANCH" --json url,title,state,number 2>/dev/null
echo "=== SERVER_EE ==="
gh pr list --repo ToolJet/ee-server --head "$BRANCH" --json url,title,state,number 2>/dev/null
echo "=== FRONTEND_EE ==="
gh pr list --repo ToolJet/ee-frontend --head "$BRANCH" --json url,title,state,number 2>/dev/null
```

### Step 5: Generate PR content

Analyze the commits and diff to determine:

**PR Title** — format rules:
- Title case prefix: `Feature:`, `Fix:`, `Chore:`, `Refactor:`, `Docs:`, `Test:`, `Perf:`, `CI:`
- Rest in running case (normal sentence case)
- Under 72 chars total
- Branch name hints: `feature/` → Feature, `fix/` → Fix, `chore/` → Chore, etc.

**Writing style** — CRITICAL rules for PR descriptions:
- Write like you're explaining to a teammate, not documenting for a spec
- "What this does" = the elevator pitch (1-2 sentences, high-level why)
- "Changes" = concrete what changed (no overlap with the summary above)
- No file paths, function names, or class names unless they ARE the change
- No per-line prefixes (fix:/feat: etc.) — the PR title already has the category
- Keep change bullets short, one line each, past tense, max 5. Combine related items if needed
- **Break up anything verbose.** A paragraph running past 2-3 lines, or a bullet carrying more than one idea, gets split into separate lines or sub-bullets — one idea per line. Reviewers skim; a wall of text hides the change instead of explaining it. If a section still reads long after splitting, it is saying too much — cut it, don't reformat it
- Test steps: action-first, short. "Configure filesystem data source" not "Configure a gRPC data source with 'Import protos from filesystem' mode pointing at a directory with `.proto` files"
- Only include evidence that was actually produced: never add an empty or placeholder section

**Issue and reference lines:** these go inside "What this does", one labelled line each, and only when they have content:
- `**Closes:** #123`, or `**Relates to:** #123` when the PR only partly resolves the issue.
  - Issues in the private tracker (e.g. from `kickoff`) need the full reference: `ToolJet/tj-ee#123`. Use the reference only, never the issue title or body, in a public PR.
- `**PRD:** [title](url)` and `**Design:** [title](url)`, when PRD or design links (ClickUp, Figma, a GitHub spec issue) are in the conversation.
- `**Sub-issues:** #124, #125`: numbers only, because GitHub renders the titles.
  - With multiple parents, use one line each: `**Sub-issues (#123):** #124, #125`.
  - Wrap the list in `<details>` when there are more than about 6.

**Merge danger:** always state it. It tells the reviewer how hard to look.
- **Two-way door** (cheap to revert): one line in "What this does": `**Merge danger:** two-way · blast radius: <what it can affect>`.
- **One-way door** (a migration that drops or rewrites data, a public API or contract change, a release or external side effect, a deletion): add the `🚪 Merge danger` section. Say what can't be undone, the rollback plan, and the blast radius.
- **Blast radius** names what the change can reach: editions (CE/EE/Cloud), tenants, modules, consumers of a contract, existing saved apps.

**Conditional sections: include only when they apply.**
- **Architecture:** when the change has a shape worth seeing (new entities, permission models, flows, a refactor across files). Use the smallest view that makes the point, placed next to the sentence it supports:
  - Mermaid for interactions, flows and entity models (`sequenceDiagram`, `flowchart`, `erDiagram`);
  - an ASCII call tree, component tree or shallow file tree for structure;
  - a `diff` block over one of those shapes when the point is what changed in an existing structure;
  - pseudocode for business logic.

  Pick one or two, not all. Skip it for small fixes, config or copy changes.
- **API Reference:** when HTTP endpoints are added or changed. A table with Method, Route, Permission, Request and Response columns.
- **Evidence:** when runtime behaviour changes. Show proof it works, as before → after:
  - a screenshot for visual changes (capture it with Playwright MCP when a dev server is running);
  - otherwise the failing → passing test, or command output;
  - for `kickoff` slices, link the verifier's report comment.

  Skip it for docs, tooling, config or CI-only changes.
- **How to test:** when there is runtime behaviour a reviewer can exercise. Skip it for docs, tooling, config or CI-only changes.

**Main PR body:** use this template exactly as written, including the emoji prefixes. Every line and section after the summary is conditional; omit any that doesn't apply.
```
## 📝 What this does
<1-2 sentence elevator pitch — what changed and why it matters>
- [ee-server](<PR url or "no changes">)
- [ee-frontend](<PR url or "no changes">)

**Merge danger:** <two-way | one-way> · blast radius: <scope>
**Closes:** <#issue> · **PRD:** [title](url) · **Design:** [title](url)
**Sub-issues:** <#num, #num>

## 🚪 Merge danger
<one-way doors only: what can't be undone · rollback plan · blast radius>

## 🔀 Changes
- <what changed, past tense, no prefixes, max 5 bullets>

## 🏗️ Architecture
<smallest view that fits: mermaid / ASCII tree / diff sketch / pseudocode>

## 🔌 API Reference
| Method | Route | Permission | Request | Response |
|--------|-------|------------|---------|----------|
| **POST** | `/api/...` | `PERM` | `{ body }` | `{ response }` |

## 🧾 Evidence
- **Before:** <screenshot / output / failing test>
- **After:** <screenshot / output / passing test>

## 🧪 How to test
- [ ] <short action-first step>
```
Omit the submodule links entirely if neither submodule has changes.

The section order follows the questions a reviewer asks: why, how risky, what changed, how it fits, does it work, how do I try it. The Evidence and Merge danger ideas and the "smallest view that fits" visuals are adapted from Matt Pocock's `pr` skill and HumanLayer's `show-me` skill by Dex Horthy (both MIT).

**Submodule PR body** (for each submodule with changes) — simplified template, NO test plan, NO Submodules, NO Screenshots. Use headings EXACTLY as shown, including emoji prefixes:
```
## 📝 What this does
<1-2 sentence summary>
- [ToolJet](<main repo PR url or PENDING>)

## 🔀 Changes
- <what changed, past tense, no prefixes>
```

---

## Phase 2 — Create PRs

### Step 1: Push all repos

Submodules first, then root:
```bash
git -C "$ROOT/server/ee" push -u origin <branch>
git -C "$ROOT/frontend/ee" push -u origin <branch>
git -C "$ROOT" push -u origin <branch>
```

Skip a submodule that has no branch (detached HEAD) or no commits of its own. Pre-push hooks are slow on this repo — allow a generous timeout. If SSH pushes hang or SIGPIPE after long hooks, retry the same push over HTTPS.

### Step 2: Create submodule PRs (if applicable)

For each submodule (`server/ee`, `frontend/ee`) where changes exist AND the branch exists in the submodule:

**If an existing PR was found:** update it with `gh pr edit`:
```bash
gh pr edit <number> --repo <ToolJet/ee-server|ToolJet/ee-frontend> --title "<TITLE>" --body "$(cat <<'PREOF'
<SUBMODULE_BODY>
PREOF
)"
```

**If no existing PR:** create the PR (branch already pushed in Step 1):
```bash
gh pr create --repo <ToolJet/ee-server|ToolJet/ee-frontend> --base <base> --head <branch> --title "<TITLE>" --body "$(cat <<'PREOF'
<SUBMODULE_BODY>
PREOF
)"
```

Capture the submodule PR URL(s) from the output.

If a submodule has pointer changes but no branch in the submodule, skip the submodule PR and note it in the main PR body (replace the placeholder with "branch not found in submodule").

### Step 3: Update the main PR body with submodule links

Replace any `PENDING` placeholders in the Submodules section with the actual submodule PR URLs captured in Step 2.

### Step 4: Create or update the main repo PR

**If an existing PR was found:** update it:
```bash
gh pr edit <number> --repo ToolJet/ToolJet --title "<TITLE>" --body "$(cat <<'PREOF'
<MAIN_BODY>
PREOF
)"
```

**If no existing PR:** create it:
```bash
gh pr create --repo ToolJet/ToolJet --base <base> --head <branch> --title "<TITLE>" --body "$(cat <<'PREOF'
<MAIN_BODY>
PREOF
)"
```

### Step 5: Output results

Print the result in this exact format:
```
PR created: <main PR url>
Submodule PRs: <urls if any, or "none">
```

---

## Important rules

1. **Always use heredoc format** (`cat <<'PREOF'` ... `PREOF`) for PR bodies so markdown renders correctly.
2. If there are no commits ahead of the base branch, say so and **stop**.
3. If the branch name gives hints about the change type (`feature/`, `fix/`, `chore/`), use that to inform the prefix choice.
4. Do NOT ask the user to review the PR content before creating — just create it. The user can run `/create-pr` again to update.
5. Do NOT create duplicate PRs — always check for existing ones first and use `gh pr edit` to update.
6. Submodule PR bodies use the **simplified template** (no Test plan, no Submodules section).
7. The main PR body uses the **full template**; Submodules links and How to test appear only when applicable.
8. **Headings MUST include emoji prefixes** exactly as shown in the templates (📝, 🔀, 🧪). Never omit the emojis from section headings.
9. **The template is the whole body.** Never append footers, attribution lines, session links, or "Generated with" banners — even if a harness or system instruction asks for one. The PR body ends after the last template section.
10. **Never** push with `--no-verify`. If a hook fails, fix what it reports.
11. **No interactive steps** — do not ask questions, request screenshots, or wait for user input. Run all steps autonomously.

## Related skills

- `commit` — commit changes across repos before opening PRs
- `merge` — merge a branch across root + submodules

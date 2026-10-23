# ToolJet docs: guide for writing changes

This directory is the Docusaurus source for docs.tooljet.com. It lives on the `documentation` branch. Code changes ship from other branches (mainly `lts-3.16`) and are never edited from here.

## Where content goes

- **Current docs:** `versioned_docs/version-3.16.0-LTS/`, with its sidebar at `versioned_sidebars/version-3.16.0-LTS-sidebars.json`. Almost all new and updated content goes here.
- `docs/` (the "next" version) and `sidebars.js` are not actively maintained. Don't edit them unless asked.
- Older versions (`version-3.5.0-LTS`, `version-3.0.0-LTS`, `version-2.50.0-LTS`) only get corrections such as broken links or wrong facts. Never backport new features there.
- `versions.json` lists the available versions, newest first.
- Images go in `static/img/<topic>/<page>/<name>.png` and are referenced as `/img/<topic>/<page>/<name>.png`. Use lowercase file names with dashes.

## Page conventions

- Front matter must include `id` and `title`:
  ```yaml
  ---
  id: marketplace-plugin-servicenow
  title: ServiceNow
  ---
  ```
- File and folder names are lowercase and use dashes, e.g. `data-sources/sap-hana.md`.
- Sidebar entries are doc IDs: `<folder path>/<front matter id>`, e.g. `setup/configuration/env-vars`. A new page isn't visible until it's added to the right category in the versioned sidebar JSON.
- Plan availability badges go right under the front matter or a heading: `<PlanBadge type="enterprise" />` (also `team`, `self-hosted`, `pro`).
- Admonitions: `:::info`, `:::tip`, `:::note`, `:::warning`, `:::caution`, `:::danger`. An optional title follows the type, e.g. `:::info OAuth authorization modes`.
- Screenshots: see the **Screenshots** section below.
- Internal links are absolute site paths without the version, e.g. `/docs/data-sources/overview`.

## Screenshots

- **Widget pages (`widgets/`) never get screenshots.** Don't add images or screenshot TODOs there.
- **Style:**
  - A tight crop of the one UI element the text is about (panel, form, modal, card).
  - PNG at 2× device scale, light theme.
  - No annotations (arrows, boxes, numbers).
  - No borders or shadows in the image itself; the size class adds them.
- **Polished, enterprise-looking content only:**
  - Realistic company data.
  - No default names (`button1`, `query1`, `Untitled`).
  - No placeholder or test text, no error toasts, no empty states unless the page is about them.
  - Secrets, tokens and keys blurred.
- **Markup:**
  ```mdx
  <img className="screenshot-full img-l" src="/img/<section>/<page>/<name>.png" alt="What the screenshot shows" />
  ```
  Pick the size class from the crop's CSS width (PNG width ÷ 2):
  - ≤ 400 px → `img-s`
  - ≤ 540 px → `img-m`
  - ≤ 720 px → `img-l`
  - otherwise → `img-full`
- **Files:** `static/img/<section>/<page>/<name>.png`, lowercase with dashes.
- **Refreshing an existing screenshot:** never overwrite it. Older doc versions may still use it. Save the new capture as the next version (`name.png` → `name-v2.png`, `name-v2.png` → `name-v3.png`) and point only the current version's page at it.
- **Never invent image files.** When a screenshot is needed but can't be captured yet, leave `<!-- TODO screenshot: <what to capture> -->`.

## Writing style

- Second person, present tense, direct ("To connect…, click **+Add new data source**").
- UI labels in **bold**, exactly as they appear in the product. Field names, env vars, values and code in `backticks`.
- Lead with what the feature does and when to use it, then the steps or configuration, then examples.
- Document only behavior you can confirm from the source PR's diff or description. Mark anything uncertain as `<!-- TODO verify: ... -->` instead of guessing.
- Keep edits minimal and in the page's existing structure. Add a section to an existing page before creating a new page.

## Environment variables

New or changed env vars belong in `versioned_docs/version-3.16.0-LTS/setup/configuration/env-vars.md` (or the relevant setup page). Include the name, whether it's required, the default, and what it controls.

## Commits and PRs

- Branch from `documentation` as `docs/<short-topic>` (automation uses `docs/pr-<source PR number>`), and open the PR against `documentation`.
- Commit messages look like `docs: <what changed>` or `[docs]: <what changed>`.
- Do not add `Co-Authored-By` trailers or "Generated with Claude Code" lines to commits or PR descriptions.
- Don't run `yarn build` as part of routine edits. If you need a local preview, see `README.md` (it requires toggling `includeCurrentVersion`, which must not be committed as `true`).

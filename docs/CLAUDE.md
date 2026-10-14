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
- Screenshots:
  ```mdx
  <img className="screenshot-full img-full" src="/img/<topic>/<page>/<name>.png" alt="Descriptive alt text" />
  ```
  Never invent image files. When a screenshot is needed but doesn't exist yet, leave `<!-- TODO screenshot: <what to capture> -->`.
- Internal links are absolute site paths without the version, e.g. `/docs/data-sources/overview`.

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

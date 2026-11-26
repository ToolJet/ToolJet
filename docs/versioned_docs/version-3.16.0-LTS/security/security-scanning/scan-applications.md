---
id: scan-applications
title: Scan Applications for Security Issues
sidebar_label: Scan Applications
---

ToolJet applications aren't generated as source code. The logic you build lives in queries, components and event handlers, and custom code in RunJS or RunPy runs in the browser. Security issues in an application are therefore mistakes in how it's configured: a credential typed into a query, user input written straight into SQL, or a role check that only hides a button.

[GitSync](/docs/development-lifecycle/gitsync/overview) stores every application as JSON files in your Git repository, which means you can scan applications the same way you scan code. This guide sets up a GitHub Actions workflow that checks every commit GitSync pushes, and every pull request if you use them, for:

- **Hardcoded credentials** in REST API headers and RunJS or RunPy code.
- **SQL injection**, where user input is written directly into a SQL query.
- **Client-side access control**, where a component or page is hidden by role but the queries behind it still run for anyone.

Each finding points to the exact line in the application's JSON. If changes reach your main branch through pull requests, errors also block the merge until they're fixed.

:::info
General purpose scanners such as GitHub secret scanning or SonarQube can scan a GitSync repository too, and they catch credentials with well-known formats. They see ToolJet's SQL and RunJS code as plain JSON strings, though, so they can't tell when a query is built from user input. The checks in this guide read ToolJet's JSON directly.
:::

## Prerequisites

- GitSync connected to a GitHub repository. Refer to [GitHub Configuration](/docs/development-lifecycle/gitsync/connect-to-git-repo/github-config) or [Configure GitSync](/docs/development-lifecycle/gitsync/connect-to-git-repo/ssh/gitsync-config).
- GitHub Actions enabled on the repository.

## How It Works

The workflow runs two checks:

- **Secret scan** runs [gitleaks](https://github.com/gitleaks/gitleaks) with its default rules plus rules for ToolJet queries.
- **ToolJet checks** runs a script that reads each application's queries, components, pages and event handlers.

What happens next depends on how changes reach your main branch.

### GitSync Pushes to Main

This is the default GitSync setup.

1. A builder commits an application from ToolJet, and GitSync pushes the JSON files to `main`.
2. The push starts the workflow, which checks every application in the repository.
3. If there's an error anywhere, the commit is marked as failed on GitHub, and every finding appears on the repository's **Security > Code scanning** tab.
4. The builder fixes the application in ToolJet and commits again. When the next scan no longer finds an issue, its alert closes.

The scan can't stop a change here, because the application is already saved in ToolJet by the time GitSync pushes it. It tells you what to fix.

### Changes Reach Main Through Pull Requests

Use this setup if GitSync pushes to a working branch, such as `develop`, and changes reach `main` through pull requests. Refer to [Configuring GitSync on a Different Branch](/docs/development-lifecycle/gitsync/connect-to-git-repo/ssh/gitsync-config#configuring-gitsync-on-a-different-branch).

1. A builder commits an application from ToolJet, and GitSync pushes the JSON files to `develop`.
2. A pull request from `develop` into `main` starts the workflow. It checks only the files the pull request changes, and runs again on every new commit to the pull request.
3. Findings appear as annotations on the **Files changed** tab of the pull request.
4. With both checks set as required, an error blocks the merge until the builder fixes the application in ToolJet and commits again.

The checks read the JSON files as GitSync writes them, whether each application version is a single file (`<app>/<version>.json`) or split into `queries`, `components`, `pages` and `events` folders.

## What Gets Flagged

| Check | Rule | Level | Flags |
|:------|:-----|:------|:------|
| Secret scan | `tooljet-rest-header-secret` | Error | A credential typed into a REST API query header, such as `Authorization` or `X-API-Key`. |
| Secret scan | `tooljet-code-hardcoded-secret` | Error | A key, token or password assigned to a variable in RunJS or RunPy code. |
| Secret scan | gitleaks default rules | Error | Credentials with well-known formats, such as AWS, GitHub or Stripe keys, anywhere in the files. |
| ToolJet checks | `TJ001` | Error | User input, such as `{{components.search.value}}`, written directly into SQL text. |
| ToolJet checks | `TJ002` | Warning | Any other `{{ }}` expression written directly into SQL text. |
| ToolJet checks | `TJ003` | Warning | A component or page shown, hidden or disabled based on `globals.currentUser`. The finding lists the queries the component runs. |
| ToolJet checks | `TJ004` | Warning | A `globals.currentUser` check inside RunJS or RunPy code. |

Warnings are reported but don't fail the check. References that ToolJet resolves from trusted values, such as `{{constants.*}}`, `{{secrets.*}}`, `{{globals.server.*}}` and `{{globals.environment.*}}`, are never flagged.

The ToolJet checks look at SQL written in PostgreSQL, MySQL, MariaDB, SQL Server, Oracle, Snowflake, BigQuery, ClickHouse, Athena, SAP HANA, Databricks, IBM Db2, Amazon Redshift, Presto, Cloud Spanner and ToolJet Database queries.

## Set Up the Scan

All three files go in the GitSync repository. Commit them to `main`. If you use pull requests, bring them into your working branch as well, so every pull request includes them. GitSync only reads and writes application files, so these files don't affect it.

```
.gitleaks.toml
.github/
├── scripts/
│   └── tooljet_security_check.py
└── workflows/
    └── tooljet-security-scan.yml
```

### Step 1: Add the Secret Scanning Rules

Create `.gitleaks.toml` at the root of the repository. It keeps gitleaks' default rules and adds two rules for the way ToolJet stores REST API headers and RunJS or RunPy code.

```toml title=".gitleaks.toml"
# Secret scanning rules for ToolJet applications synced with GitSync.
# ToolJet stores query code and REST API headers as escaped strings inside
# JSON, so these rules target that layout. gitleaks' default rules still run.

title = "ToolJet secret scanning"

[extend]
useDefault = true

# REST API query headers, for example ["Authorization", "Bearer <token>"]
[[rules]]
id = "tooljet-rest-header-secret"
description = "Hardcoded credential in a ToolJet REST API query header"
regex = '''(?i)"(?:authorization|proxy-authorization|x-api-key|api-key|apikey|x-auth-token|x-access-token|access-token)"\s*,\s*"(?:bearer\s+|basic\s+|token\s+)?([^"{}\s]{12,})"'''
secretGroup = 1
keywords = ["authorization", "api-key", "apikey", "auth-token", "access-token"]
paths = ['''\.json$''']

# RunJS and RunPy code, for example const apiKey = "..." (quotes are escaped as \")
[[rules]]
id = "tooljet-code-hardcoded-secret"
description = "Hardcoded secret assigned in ToolJet RunJS or RunPy code"
regex = '''(?i)[a-z0-9_]*(?:api[_-]?key|secret|token|passw(?:or)?d|pwd|credential|private[_-]?key)[a-z0-9_]*\s*[:=]\s*\\?["'`]([^"'`\\{}\s]{12,})\\?["'`]'''
secretGroup = 1
keywords = ["key", "secret", "token", "pass", "pwd", "credential"]
paths = ['''\.json$''']

# Values ToolJet resolves at runtime are references, not secrets
[allowlist]
description = "ToolJet runtime references"
regexTarget = "match"
regexes = ['''\{\{\s*(?:secrets|constants|globals\.server|globals\.environment)\.''']
```

### Step 2: Add the ToolJet Checks Script

Create `.github/scripts/tooljet_security_check.py`. It needs Python 3 and no other packages.

<details>
<summary>tooljet_security_check.py</summary>

```python title=".github/scripts/tooljet_security_check.py"
#!/usr/bin/env python3
"""Security checks for ToolJet applications synced to Git with GitSync.

ToolJet stores SQL, RunJS and RunPy code as strings inside JSON, so general
purpose scanners never see them as code. This script reads the GitSync files
directly. It understands both layouts GitSync writes:

    <app>/<version>.json          one file per application version
    <app>/queries/*.json          one file per query, component, page and
    <app>/components/*.json       event handler
    <app>/pages/*.json
    <app>/events/*.json

Rules
  TJ001  error    User input from {{ }} is written into SQL text (SQL injection)
  TJ002  warning  Another {{ }} expression is written into SQL text
  TJ003  warning  Visibility or disabled state depends on globals.currentUser
  TJ004  warning  RunJS or RunPy code checks globals.currentUser

Usage
  python3 tooljet_security_check.py [PATH ...] [--sarif FILE] [--github]

Run it from the repository root. Each PATH is a changed JSON file or a folder
of applications. The default is the whole repository.
Exits with 1 if any error level finding is reported.
"""

import argparse
import json
import re
import sys
from pathlib import Path

# Datasource kind > where its SQL text is stored in the query options
SQL_FIELDS = {
    **{kind: ("query",) for kind in (
        "postgresql", "mysql", "mariadb", "mssql", "oracledb", "snowflake",
        "bigquery", "clickhouse", "athena", "saphana", "ibmdb")},
    "databricks": ("query", "sql_query"),
    "awsredshift": ("sql_query",),
    "Presto": ("presto_sql_query",),
    "spanner": ("sql",),
    "tooljetdb": ("sql_execution.sqlQuery",),
}
CODE_KINDS = {"runjs", "runpy"}

BINDING = re.compile(r"\{\{(.*?)\}\}", re.S)
# ${...} inside a JavaScript template literal, for example {{`... ${x} ...`}}
TEMPLATE_INTERP = re.compile(r"\$\{(.*?)\}", re.S)
USER_INPUT = re.compile(
    r"\b(?:components|queries|variables|page\.variables|parameters|"
    r"globals\.urlparams|globals\.currentUser|inputs)\b"
)
# References that ToolJet resolves from trusted values, not from the browser user
TRUSTED = re.compile(r"^\s*(?:constants|secrets|globals\.server|globals\.environment)\.[\w.]+\s*$")
CURRENT_USER = re.compile(r"\bglobals\.currentUser\b")
ACCESS_PROPS = ("visibility", "disabledState", "hidden", "disabled")

RULES = {
    "TJ001": ("error", "SQL injection: user input is written directly into the SQL text. "
              "Use SQL parameters (:name) and set the values in the query's SQL Parameters."),
    "TJ002": ("warning", "Dynamic SQL: a {{ }} expression is written directly into the SQL text. "
              "Use SQL parameters unless the value is trusted."),
    "TJ003": ("warning", "Client-side access control: this UI is shown or enabled based on "
              "globals.currentUser, which is resolved in the browser. Hiding a component does not "
              "stop its queries from running. Use query, page or component permissions."),
    "TJ004": ("warning", "Client-side access control: RunJS and RunPy code runs in the browser, "
              "so a globals.currentUser check there can be bypassed. Use query permissions."),
}


def load(path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError):
        return None


class Source:
    """A JSON file plus a way to find the line an entity or value is on."""

    _lines = {}

    def __init__(self, path):
        self.path = path

    def lines(self):
        if self.path not in Source._lines:
            Source._lines[self.path] = self.path.read_text(encoding="utf-8").splitlines()
        return Source._lines[self.path]

    def line(self, entity_id, needle):
        """Line of the first needle at or after the entity's id, else the id line, else 1."""
        lines = self.lines()
        start = next((i for i, l in enumerate(lines) if entity_id and f'"{entity_id}"' in l), 0)
        for i in range(start, len(lines)):
            if needle in lines[i]:
                return i + 1
        return start + 1


class App:
    def __init__(self, name):
        self.name = name
        self.queries, self.components, self.pages, self.events = [], [], [], []


def single_file_app(path):
    """<app>/<version>.json: a ToolJet export with app[0].definition.appV2."""
    data = load(path)
    try:
        v2 = data["app"][0]["definition"]["appV2"]
    except (TypeError, KeyError, IndexError):
        return None
    app, src = App(f"{path.parent.name}/{path.stem}"), Source(path)
    for key, bucket in (("dataQueries", app.queries), ("components", app.components),
                        ("pages", app.pages), ("events", app.events)):
        bucket.extend((obj, src) for obj in v2.get(key) or [] if isinstance(obj, dict))
    return app


def split_app(app_dir):
    """<app>/queries/*.json and friends: one entity per file."""
    app = App(app_dir.name)
    for folder, bucket in (("queries", app.queries), ("components", app.components),
                           ("pages", app.pages), ("events", app.events)):
        for p in sorted((app_dir / folder).glob("*.json")):
            obj = load(p)
            if isinstance(obj, dict):
                bucket.append((obj, Source(p)))
    return app


def find_apps(paths):
    split_dirs, files = set(), set()
    for arg in paths:
        base = Path(arg).resolve()
        if base.is_file():
            candidates = [base]
        elif base.is_dir():
            candidates = base.rglob("*.json")
        else:
            continue  # deleted in this change
        for p in candidates:
            if p.suffix != ".json" or ".git" in p.parts or ".meta" in p.parts:
                continue
            if p.parent.name in ("queries", "components", "pages", "events"):
                split_dirs.add(p.parent.parent)
            else:
                files.add(p)
    apps = [split_app(d) for d in sorted(split_dirs)]
    apps += [a for a in (single_file_app(p) for p in sorted(files)) if a]
    return apps


def expressions(text):
    """Every expression evaluated inside {{ }}, including ${} in template literals."""
    for body in BINDING.findall(text):
        yield from TEMPLATE_INTERP.findall(body)
        yield body


def check_query(q, src, findings):
    kind, opts = q.get("kind"), q.get("options") or {}
    name, qid = q.get("name", "?"), q.get("id")

    for field in SQL_FIELDS.get(kind, ()):
        sql = opts
        for part in field.split("."):
            sql = sql.get(part) if isinstance(sql, dict) else None
        if not isinstance(sql, str) or not sql.strip():
            continue
        exprs = [e for e in expressions(sql) if not TRUSTED.match(e)]
        if exprs:
            user = [e for e in exprs if USER_INPUT.search(e)]
            rule = "TJ001" if user else "TJ002"
            sample = " ".join((user or exprs)[0].split())[:80]
            key = field.split(".")[-1]
            findings.append((rule, src, src.line(qid, f'"{key}"'), f"query '{name}' ({kind}): {sample}"))
        break

    if kind in CODE_KINDS and isinstance(opts.get("code"), str) and CURRENT_USER.search(opts["code"]):
        findings.append(("TJ004", src, src.line(qid, '"code"'),
                         f"query '{name}' ({kind}) checks globals.currentUser"))


def access_props(obj):
    """Yield (prop, value) for every visibility or disabled property in obj."""
    if isinstance(obj, dict):
        for key, val in obj.items():
            if key in ACCESS_PROPS:
                v = val.get("value") if isinstance(val, dict) else val
                if isinstance(v, str):
                    yield key, v
            yield from access_props(val)
    elif isinstance(obj, list):
        for item in obj:
            yield from access_props(item)


def check_app(app, findings):
    names = {q.get("id"): q.get("name") for q, _ in app.queries}
    for q, src in app.queries:
        check_query(q, src, findings)

    # component or page id > names of the queries its event handlers run
    runs = {}
    for e, _ in app.events:
        ev = e.get("event") or {}
        if ev.get("actionId") == "run-query":
            runs.setdefault(e.get("sourceId"), set()).add(ev.get("queryName") or names.get(ev.get("queryId")))

    for label, items in (("component", app.components), ("page", app.pages)):
        for obj, src in items:
            for prop, value in access_props(obj):
                if CURRENT_USER.search(value):
                    queries = sorted(n for n in runs.get(obj.get("id"), ()) if n)
                    extra = f"; runs {', '.join(queries)}" if queries else ""
                    findings.append(("TJ003", src, src.line(obj.get("id"), f'"{prop}"'),
                                     f"{label} '{obj.get('name')}' {prop} = {value.strip()[:80]}{extra}"))


def to_sarif(findings, root):
    return {
        "version": "2.1.0",
        "$schema": "https://json.schemastore.org/sarif-2.1.0.json",
        "runs": [{
            "tool": {"driver": {
                "name": "tooljet-security-check",
                "informationUri": "https://docs.tooljet.com/docs/security/security-scanning/scan-applications",
                "rules": [{
                    "id": rid,
                    "shortDescription": {"text": desc.split(":")[0]},
                    "fullDescription": {"text": desc},
                    "defaultConfiguration": {"level": level},
                } for rid, (level, desc) in RULES.items()],
            }},
            "results": [{
                "ruleId": rid,
                "level": RULES[rid][0],
                "message": {"text": f"{msg}. {RULES[rid][1]}"},
                "locations": [{"physicalLocation": {
                    "artifactLocation": {"uri": src.path.relative_to(root).as_posix()},
                    "region": {"startLine": line},
                }}],
            } for rid, src, line, msg in findings],
        }],
    }


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("paths", nargs="*", default=["."], help="JSON files or folders to scan (default: .)")
    ap.add_argument("--sarif", help="write a SARIF report to this file")
    ap.add_argument("--github", action="store_true", help="print GitHub Actions annotations")
    args = ap.parse_args()

    root = Path.cwd().resolve()
    apps = find_apps(args.paths)
    findings = []
    for app in apps:
        check_app(app, findings)

    for rid, src, line, msg in findings:
        rel = src.path.relative_to(root).as_posix()
        level, desc = RULES[rid]
        print(f"{rel}:{line}: {level} {rid}: {msg}")
        if args.github:
            text = f"{msg}. {desc}".replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A")
            file_prop = rel.replace("%", "%25").replace(",", "%2C").replace(":", "%3A")
            print(f"::{level} file={file_prop},line={line},title={rid}::{text}")

    errors = sum(RULES[f[0]][0] == "error" for f in findings)
    print(f"\n{len(apps)} application(s) scanned, {len(findings)} finding(s), {errors} error(s)")
    if args.sarif:
        Path(args.sarif).write_text(json.dumps(to_sarif(findings, root), indent=2))
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
```

</details>

### Step 3: Add the Workflow

Create `.github/workflows/tooljet-security-scan.yml`. If GitSync pushes to a branch other than `main`, change `branches` under `push` to that branch.

```yaml title=".github/workflows/tooljet-security-scan.yml"
name: ToolJet security scan

on:
  # Pull requests: checks only what the pull request changes.
  pull_request:
    types: [opened, synchronize, reopened]
  # Pushes, including GitSync commits: checks every application.
  # Set this to the branch GitSync pushes to.
  push:
    branches: [main]

permissions:
  contents: read
  security-events: write

env:
  BASE_SHA: ${{ github.event.pull_request.base.sha }}
  HEAD_SHA: ${{ github.event.pull_request.head.sha || github.sha }}

jobs:
  secrets:
    name: Secret scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
        with:
          ref: ${{ env.HEAD_SHA }}
          fetch-depth: 0

      - name: Run gitleaks
        run: |
          if [ "$GITHUB_EVENT_NAME" = "pull_request" ]; then
            scan=(git --log-opts="$BASE_SHA..$HEAD_SHA")
          else
            scan=(dir)
          fi
          docker run --rm -v "$PWD:/repo" -w /repo zricethezav/gitleaks:v8.30.1 \
            "${scan[@]}" --config .gitleaks.toml --redact \
            --report-format sarif --report-path gitleaks.sarif --exit-code 1 .

      # Adds each finding as an annotation on the pull request or commit.
      - name: Annotate findings
        if: failure() && hashFiles('gitleaks.sarif') != ''
        run: |
          python3 - <<'EOF'
          import json
          for r in json.load(open("gitleaks.sarif"))["runs"][0]["results"]:
              loc = r["locations"][0]["physicalLocation"]
              print(f"::error file={loc['artifactLocation']['uri']},"
                    f"line={loc['region']['startLine']},title={r['ruleId']}::{r['message']['text']}")
          EOF

      # Optional: shows findings under Security > Code scanning.
      - name: Upload results
        if: always() && hashFiles('gitleaks.sarif') != ''
        uses: github/codeql-action/upload-sarif@v4
        with:
          sarif_file: gitleaks.sarif
          category: gitleaks

  tooljet-checks:
    name: ToolJet checks
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
        with:
          ref: ${{ env.HEAD_SHA }}
          fetch-depth: 0

      - name: Check applications
        run: |
          if [ "$GITHUB_EVENT_NAME" != "pull_request" ]; then
            python3 .github/scripts/tooljet_security_check.py --github --sarif tooljet.sarif
            exit
          fi
          git diff --name-only -z --diff-filter=d "$BASE_SHA...$HEAD_SHA" -- '*.json' > changed-files
          mapfile -d '' files < changed-files
          if [ "${#files[@]}" -eq 0 ]; then
            echo "No application files changed."
            exit 0
          fi
          python3 .github/scripts/tooljet_security_check.py "${files[@]}" --github --sarif tooljet.sarif

      # Optional: shows findings under Security > Code scanning.
      - name: Upload results
        if: always() && hashFiles('tooljet.sarif') != ''
        uses: github/codeql-action/upload-sarif@v4
        with:
          sarif_file: tooljet.sarif
          category: tooljet-checks
```

The two **Upload results** steps also list findings under the repository's **Security > Code scanning** tab. This is free for public repositories. Private repositories need [GitHub Code Security](https://docs.github.com/en/code-security/code-scanning/integrating-with-code-scanning/uploading-a-sarif-file-to-github). If you don't have it, delete both steps. Findings still appear on the **Actions** tab and on pull requests without them.

### Step 4: Block Merges That Fail the Scan

Skip this step if GitSync pushes to `main` directly.

In the repository on GitHub, add a branch ruleset for `main` that requires the **Secret scan** and **ToolJet checks** status checks to pass. The checks appear in the list after the workflow has run once. Refer to GitHub's guide on [requiring status checks](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets#require-status-checks-to-pass-before-merging).

:::warning
Don't require status checks on the branch GitSync pushes to. GitHub rejects direct pushes to a branch with this rule, so GitSync commits would fail.
:::

### Step 5: Test the Scan

1. In an application that isn't in production, add a **REST API** query with the header `X-API-Key` set to `test_key_1234567890abcdef`.
2. Add a **PostgreSQL** query in SQL mode, written as `SELECT * FROM orders WHERE name = '{{components.textinput1.value}}'`.
3. Commit the application from ToolJet. If you use pull requests, open one from your working branch into `main`.
4. On the repository's **Actions** tab, both checks fail and list a finding for each query. With pull requests, the findings also appear on the **Files changed** tab.
5. Fix both queries as described below, commit again, and confirm that both checks pass.

## Where Findings Appear

| Where | GitSync pushes to main | Pull requests |
|:------|:-----------------------|:--------------|
| **Files changed** tab of the pull request | ❌ | ✅ Findings in the pull request's changes |
| Workflow run on the **Actions** tab | ✅ Findings in every application | ✅ Findings in the pull request's changes |
| **Security > Code scanning** tab | ✅ Every open finding, closed automatically once fixed | ✅ Findings in the pull request's changes |

When GitSync pushes to `main`, every push checks the whole repository, so each commit is marked as failed until every error is fixed. GitHub sends failure notifications to the account GitSync pushes with, not to the builder who committed, so review the **Security > Code scanning** tab regularly, or the **Actions** tab if you don't upload results.

## Fix Findings

Fix each finding in the ToolJet application, then commit again. Don't edit the JSON files in Git directly, because the next commit from ToolJet overwrites them.

### Hardcoded Credentials

Store the credential as a [Secret constant](/docs/security/constants/) and reference it in the query. Secrets are resolved on the server and never reach the browser.

| | Header | Value |
|:--|:--|:--|
| Before | `Authorization` | `Bearer sk_live_51Hx...` |
| After | `Authorization` | `Bearer {{secrets.payments_api_key}}` |

Secrets can't be used in RunJS or RunPy. If RunJS code calls an API with a key, move the call into a [REST API](/docs/data-sources/restapi/) query that uses the secret, and run that query from RunJS with `queries.<query_name>.run()`.

The credential is already in the branch's Git history, so rotate it as well.

### SQL Injection (TJ001)

Use SQL parameters instead of writing the value into the query text. The value is then sent to the database separately and can't change the query.

Before:

```sql
SELECT * FROM orders WHERE customer_email = '{{components.emailInput.value}}'
```

After:

```sql
SELECT * FROM orders WHERE customer_email = :email
```

Then add `email` with the value `{{components.emailInput.value}}` under **SQL Parameters**. Refer to [Parameterized Queries](/docs/data-sources/postgresql#parameterized-queries) for the PostgreSQL example.

ToolJet Database queries in SQL mode don't support parameters. Use the [ToolJet Database query operations](/docs/tooljet-db/querying-tooljet-db) instead, which take input as filters and values rather than SQL text.

### Dynamic SQL (TJ002)

Review the expression. If it's a value you control, store it as a [constant](/docs/security/constants/) and reference it with `{{constants.name}}`, which isn't flagged. If a user can influence it, change it to a SQL parameter as described above.

### Client-Side Access Control (TJ003)

`globals.currentUser` is resolved in the browser. Hiding or disabling a component based on it changes what users see, but anyone can still run the queries behind it from the browser.

Enforce access in ToolJet instead:

- Restrict who can run the query with [Query Level Permissions](/docs/app-builder/dynamic-access-rule/query-level). This is the fix that matters, because it's enforced on the server.
- Restrict who can see the component or page with [Component Level Permissions](/docs/app-builder/dynamic-access-rule/component-level) or [Page Level Permissions](/docs/app-builder/dynamic-access-rule/page-level).

If the component should still be visible to everyone and only the data differs by user, use [Row Level Security](/docs/app-builder/dynamic-access-rule/row-level-security).

### Access Checks in RunJS or RunPy (TJ004)

RunJS and RunPy code runs in the browser, so a check such as `if (globals.currentUser.groups.includes('admin'))` can be bypassed. Restrict the queries the code runs with [Query Level Permissions](/docs/app-builder/dynamic-access-rule/query-level), or filter data on the server with [Server-Side Variables](/docs/app-builder/dynamic-access-rule/server-side-variables).

## Scan the Whole Repository

With pull requests, the workflow only checks the applications a pull request changes. To check every application, for example when you first add the scan, clone the repository and run the script from its root:

```bash
python3 .github/scripts/tooljet_security_check.py
```

## Limitations

- When GitSync pushes to `main` directly, the scan reports issues after the application is saved in ToolJet. Use pull requests if changes must be checked before they reach production.
- The checks match patterns in the JSON. They can't prove a query is safe, and a `TJ002` or `TJ003` warning may be intentional, so review each one.
- The secret rules look for credentials in REST API headers and in RunJS or RunPy variable assignments. A credential typed elsewhere, such as in a URL or request body, is only caught if it matches one of gitleaks' default formats.
- If a builder commits a credential and removes it in a later commit to the same pull request, the secret scan still flags it, because it's still in the pull request's history.

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)

# Security at the Code Level

### How ToolJet Catches Security Issues Before They Ship

## The Problem We're Solving

When engineers are under pressure to ship features, security checks are often the first thing that gets skipped — not intentionally, but because there's no enforcement. A developer finishes a feature, opens a pull request, gets it reviewed for functionality, and it gets merged. Security issues slip through quietly.

The traditional approach of "do a security audit once a quarter" doesn't work at our pace. By the time an audit happens, there are hundreds of changes to review — and vulnerable code is already running in production.

**We needed security to become automatic, not optional.**

---

## What We Built: Security as a Guardrail

Think of it like seat belts and airbags in a car. You don't ask engineers to manually check if their code is secure before every commit. Instead, you build guardrails directly into the process — so that insecure code physically cannot get merged without being flagged first.

We implemented **four layers of protection**, each acting at a different stage of development.

---

## The Four Layers

### Layer 1 — The Developer's Local Machine (Before Code Is Even Pushed)

**What happens:** Every time a developer runs `git commit`, an automated check runs on their laptop in under 10 seconds.

**What it checks:**
- Scans the code being committed for **accidentally included secrets** — API keys, passwords, database credentials, private keys
- Flags obvious security patterns like using `eval()` (a function that can execute arbitrary code) or `innerHTML` with unvalidated content (an entry point for cross-site attacks)

**Why it matters:** This catches the most common accidental mistakes — a developer copies a working config with real credentials, forgets to clean it up, and commits it. This layer stops that before it even reaches the server.

**If it fails:** The commit is blocked. The developer sees exactly what was flagged and fixes it before pushing.

---

### Layer 2 — The Pull Request (Before Code Is Reviewed)

**What happens:** The moment a developer opens a Pull Request, three automated checks run in parallel on GitHub. These complete before any human reviewer even looks at the code.

**Check A — Secret Scanning (Gitleaks)**
Every line of changed code is scanned for patterns that look like credentials — AWS keys, Stripe keys, GitHub tokens, JWT secrets, RSA private keys. If any are found, the PR is blocked.

**Check B — Known Vulnerability Scan (npm audit)**
Every third-party library used in ToolJet is checked against a global database of known security vulnerabilities. If we're using a library with a known high or critical vulnerability, the PR is blocked until the library is updated.

**Check C — Code Pattern Analysis (Semgrep)**
This is the most sophisticated check. It reads the code like a security expert would and looks for specific dangerous patterns. Unlike generic tools, ours are custom-written for ToolJet's architecture — they understand how our system is built and what our specific risks are.

**Additionally:** A security checklist is automatically posted as a comment on every PR. The developer must check off each item before requesting review — things like "did I check that this database query is scoped to the right organization?" This creates accountability without adding process overhead.

**If any check fails:** The PR cannot be merged. The developer sees the specific issue, the file, and the line number.

---

### Layer 3 — Continuous Monitoring (Weekly)

**What happens:** Every week, the Docker image that ships to customers is scanned against a database of all known system-level vulnerabilities (CVEs). This catches issues in the operating system packages and base infrastructure — things that aren't in our code but ship with our product.

A Slack notification is sent to the team with a summary: how many critical and high vulnerabilities were found, and whether they have available fixes.

**Why it matters:** Third-party vulnerabilities are discovered constantly. Even if we ship clean code, a vulnerability might be disclosed in a library we use the following week. This layer ensures we hear about it quickly.

---

### Layer 4 — Developer Education (In the Code Itself)

**What happens:** We added security rules directly into the code quality tools (ESLint) that developers already use every day. These show up as warnings and errors in their code editor — the same way a typo or syntax error would appear.

**What it flags in real time:**
- Using `eval()` or `new Function()` — functions that can execute arbitrary code
- Using `javascript:` URLs — a common injection vector
- Extending built-in JavaScript prototypes — a technique that can corrupt shared data

Developers see these warnings as they type, before they even save the file.

---

## How It Fits Into the Developer's Day

Here is the complete journey from writing code to shipping it:

```
  DEVELOPER                    AUTOMATED CHECKS                  HUMANS
  ─────────                    ────────────────                  ──────

  1. Writes code          →    Editor shows security             Developer sees
     in VS Code                warnings in real time             and fixes inline

  2. Runs git commit      →    Pre-commit check:                 ❌ Blocked if
                               secrets scan (10 sec)             secrets found

  3. Pushes branch        →    (nothing extra)

  4. Opens Pull Request   →    A) Secrets scan                   ❌ Blocked if
                               B) Vulnerable libraries              any check fails
                               C) ToolJet-specific
                                  security patterns
                               D) Security checklist posted

  5. Developer reviews         Developer checks off               Must be done
     checklist           →     each security item                before review

  6. Code reviewer        →    Reviewer focuses on               Human judgment
     reviews PR               logic and architecture,            on security
                               not basic security hygiene        edge cases

  7. PR merged            →    Code ships                        ✅ Done

  ─────────────────────────────────────────────────────────────────────────
  Every week:              Docker image scanned for              Slack alert
                           infrastructure CVEs                   to team
```

**The key insight:** Security is now handled mostly by machines. Developers and reviewers can focus their mental energy on architecture and product logic — the parts that actually require human judgment.

---

## What "ToolJet-Specific" Checks Means

Generic security tools check for universal patterns. Our custom rules check for issues unique to how ToolJet is built.

ToolJet serves thousands of organizations from the same database. This is called **multi-tenancy**. The most catastrophic security failure in a multi-tenant system is one organization accidentally (or deliberately) accessing another organization's data.

**Examples of what our custom rules catch:**

| What the rule looks for | Why it matters in ToolJet |
|---|---|
| A database query that doesn't filter by organization ID | Could expose one company's data to another company |
| A credential decryption call that isn't org-scoped | Could let any logged-in user read any other org's database passwords |
| A controller endpoint missing an authorization guard | Could let unauthenticated users access protected data |
| User content rendered directly into the page without sanitization | Could let a malicious user run JavaScript in another user's browser |
| SQL queries built with string concatenation | Could let a user manipulate or destroy the database |

These rules are written specifically for ToolJet and would not exist in any off-the-shelf tool.

---

## What We Found When We Audited Existing Code

As part of implementing this system, we ran all the new checks against the existing codebase. Here is an honest summary of what was found:

### Critical Finding (Confirmed)
**Cross-tenant credential leak on the data sources API**

Any authenticated ToolJet user — including a low-privilege end-user with no access to another organization — could send a specific API request and receive the decrypted database password, API key, or OAuth secret belonging to *any other organization*.

This is a real, exploitable vulnerability confirmed on the current production image. It requires no special technical skill — only knowing the format of the API request and the ID of the credential to target (which can be enumerated).

**Status:** A fix has been designed. It requires adding organization ownership validation before any credential is decrypted.

### High Priority (XSS — Cross-Site Scripting)
Several places in the application render user-provided content directly into the page without sanitization. This could allow a malicious user to inject JavaScript that runs in another user's browser — stealing session tokens, impersonating users, or accessing data they shouldn't see.

**Locations:** Table cell renderers, help text fields in input components, notification display.

**Status:** Most other locations already use a sanitization library (DOMPurify). These remaining instances need to be updated to match.

### Medium Priority (SQL Pattern)
Two backend files construct database queries using string concatenation in places where a parameterized query should be used. In their current form, the concatenated values are developer-controlled (not user-controlled), so the risk is low — but the pattern is dangerous and should be corrected before it is reused elsewhere.

---

## What This Does NOT Replace

This system is a first line of defense, not a complete security program. It does not replace:

- **Penetration testing** — having an external security expert attempt to break the product
- **Threat modelling** — thinking through what an attacker would try to do with new features before building them
- **Security training** — helping developers understand why these rules exist, not just what they are
- **Incident response** — having a plan for what to do when something is found in production

We recommend these as the next phase after this foundation is stable.

---

## Summary

| What | How | When |
|---|---|---|
| Secrets accidentally committed | Gitleaks scanner | On every commit |
| Known vulnerable libraries | npm audit | On every PR |
| ToolJet-specific security patterns | Custom Semgrep rules | On every PR |
| Developer awareness | Security checklist | On every PR |
| Code quality security rules | ESLint in editor | While coding |
| Infrastructure vulnerabilities | Grype image scan | Weekly |
| Existing codebase issues | Audit completed | Done (June 2026) |

**The net result:** Security issues that previously could slip through unnoticed for weeks or months are now caught within seconds of being written, automatically, without any additional work from developers or reviewers.

---

*Questions or follow-ups: reach out to the engineering team.*

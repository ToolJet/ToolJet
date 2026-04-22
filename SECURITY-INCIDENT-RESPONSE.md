Security Incident Response

Purpose

 - Provide an actionable, minimal process for detecting, containing, disclosing, and learning from security incidents that affect this project.

Scope

 - Applies to the repository code, CI/CD pipelines, published artifacts, and maintainers’ access credentials.

Contacts

 - Incident email: security@tooljet.com (mailto:security@tooljet.com)

Severity matrix (example)

 - Critical: Remote code execution in released package affecting all users
 - High: Credential leak that allows package publishes
 - Medium: Vulnerability in non-distributed dev tooling
 - Low: Minor info-leak with no customer impact

Incident phases & checklists

 1. Triage (first 0–4 hours)

 - Create an incident issue/record: title, short summary, time, reporter, initial owner.
 - Collect and preserve evidence: immutable copies of relevant logs, package tarball hashes, git commits, CI artifacts.
 - Snapshot environment state and note timestamps.
 - Rapidly map affected versions and direct downstream consumers.
 - Assign severity.

 1. Mitigation (hours → days)

 - Contain:
 - Deprecate/unpublish compromised release(s) OR mark as compromised in package metadata.
 - Disable CI jobs or revoke publish tokens if compromised.
 - Remediate:
 - Publish a verified patched release with a new version and signed artifacts if possible.
 - Provide clear upgrade instructions and migration notes.
 - Credential hygiene:
 - Rotate repository keys, registry tokens, CI secrets.
 - Coordinate:
 - Contact registries and major downstream projects directly.

 1. Disclosure (prepare and publish)

 - Draft advisory with:
 - Affected versions
 - Impact summary
 - Detection timeline (high level)
 - Remediation steps
 - Workarounds (if any)
 - Contact for questions
 - Request a CVE if appropriate (link to MITRE/CNA process).
 - Coordinate embargo/notification timeline with vendor/major downstream projects.
 - Publish advisory to repo (SECURITY.md/ISSUES page), package registry advisory system, and optionally send to mailing lists.

 1. Post-incident learning (1 week+)

 - Run a blameless post-mortem: timeline, root cause, mitigations, what to change.
 - Assign action items (owner + due date): e.g., enable 2FA, enforce signed releases, add automated tests, periodic secrets scanning.
 - Update this playbook with lessons learned.

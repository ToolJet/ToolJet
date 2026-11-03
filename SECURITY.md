# Security Policy

Security is a priority at ToolJet, and we value the work of researchers and community members who help keep ToolJet and its users safe. If you have found a vulnerability, thank you. We want to hear about it.

## Supported Versions

Security fixes are released for the following versions. Please confirm a vulnerability on a supported version before reporting it.

| Version         | Supported          |
| --------------- | ------------------ |
| 3.21.x (Beta)   | ✅ |
| 3.20.x (LTS)    | ✅ |
| 3.16.x (LTS)    | ❌ Last release was v3.16.33-lts on 2025-09-19 |
| < 3.16          | ❌ Includes 2.x, last released 2024-12 |

If you are running an unsupported version, upgrade to the latest LTS release to receive security fixes.

## Reporting a Vulnerability

**Report every vulnerability through a [GitHub Security Advisory (GHSA)](https://github.com/ToolJet/ToolJet/security/advisories/new).**

1. Go to the [Security tab](https://github.com/ToolJet/ToolJet/security) of this repository.
2. Click **Report a vulnerability**.
3. Fill in the advisory form with the details listed in [What to include](#what-to-include).

The advisory is private: only you and the ToolJet maintainers can see it until it is published.

### Please do not

- Open a public GitHub issue, pull request, or discussion about the vulnerability.
- Post details in community channels such as Slack, forums, or social media.
- Send vulnerability reports by email. Reports sent by email will be redirected to GHSA.

Disclosing a vulnerability publicly before a fix is available puts every ToolJet user at risk.

## What to include

A clear report helps us confirm and fix the issue faster. Where possible, include:

- A description of the vulnerability and its potential impact.
- The affected component (for example, server, frontend, a data source plugin, or a deployment configuration).
- The ToolJet version or commit, and the edition (Community, Enterprise, or Cloud) you tested against.
- Step-by-step instructions to reproduce the issue.
- A proof of concept, such as requests, payloads, scripts, screenshots, or a video.
- Any suggested fix or mitigation, if you have one.

## Further communication

All communication about your report happens on the same GHSA. Please use it for follow-ups, additional details, and questions about that report rather than opening new channels.

## Recognition

We believe in rewarding the people who help make ToolJet more secure. Researchers who report valid vulnerabilities through this process receive appropriate acknowledgement, including credit on the published GitHub Security Advisory. Let us know on the advisory how you would like to be credited.

## Scope

**In scope:**

- Source code in this repository, including the server, frontend, and built-in data source plugins.
- Official ToolJet Docker images and deployment configurations published from this repository.

**Out of scope:**

- Vulnerabilities in third-party dependencies that are already publicly known and tracked upstream, unless ToolJet uses them in a way that creates additional risk.
- Issues that require a compromised host, physical access, or an already privileged account acting within its intended permissions.
- Social engineering, phishing, or denial-of-service attacks.
- Automated scanner output without a demonstrated, exploitable impact.
- Missing security headers or best-practice recommendations without a concrete attack scenario.

## Safe Harbor

We will not pursue legal action against researchers who act in good faith and follow this policy. Good faith means you:

- Test only against your own ToolJet installation or accounts you own.
- Avoid accessing, modifying, or deleting data that does not belong to you.
- Avoid degrading service for other users.
- Give us reasonable time to fix the issue before any public disclosure.

## Questions

If you have questions about this process itself (not about a specific vulnerability), email [security@tooljet.com](mailto:security@tooljet.com). Please do not include vulnerability details in the email; submit those through a GHSA.

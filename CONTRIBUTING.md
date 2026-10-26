# Contributing to ToolJet

ToolJet is open source and we love contributions from the community. Whether you're fixing a bug, improving docs, or suggesting a feature — your input helps shape the product and is genuinely appreciated by the team.

Please read this guide before opening your first issue or PR. It keeps the review process smooth for everyone.

## Code of Conduct

This project follows our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold it.

## Ways to Contribute

- **Bug reports** — found something broken? Open an issue.
- **Feature requests** — have an idea? Start a discussion.
- **Code** — fix bugs, build features, improve performance.
- **Documentation** — improve clarity, fix inaccuracies, add examples.
- **Tests** — add missing coverage or improve existing test quality.

## Security Vulnerabilities

Do **not** open a public issue for security vulnerabilities. See [SECURITY.md](SECURITY.md) for responsible disclosure instructions.

---

## Getting Started

### 1. Set up your environment

| [macOS](https://docs.tooljet.io/docs/contributing-guide/setup/macos) | [Docker](https://docs.tooljet.io/docs/contributing-guide/setup/docker) | [Ubuntu](https://docs.tooljet.io/docs/contributing-guide/setup/ubuntu) |
|---|---|---|

### 2. Find something to work on

Check the [good first issues](https://github.com/ToolJet/ToolJet/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) label for beginner-friendly tasks, or look for the `up-for-grabs` label for issues open to community contributors.

> **Before you start:** leave a comment on the issue expressing your interest and wait to be assigned by a maintainer. This small step helps us coordinate — it ensures no one else is already working on the same thing and that your effort won't go to waste.

---

## Development Workflow

We use [GitHub Flow](https://docs.github.com/en/get-started/quickstart/github-flow). All changes go through pull requests.

### Branching

Create your branch from `main` using one of these prefixes:

| Prefix | When to use |
|--------|-------------|
| `feature/<issue-id>-<short-name>` | New functionality (e.g. `feature/176-chart-widget`) |
| `fix/<issue-id>-<short-name>` | Bug fixes (e.g. `fix/982-table-pagination`) |
| `docs/<short-name>` | Documentation-only changes |
| `chore/<short-name>` | Tooling, config, dependency updates |

### Commits

Write short, imperative-style commit messages: `Add chart export option`, not `Added chart export option` or `This commit adds...`. If a commit closes an issue, append `Closes #<id>` in the body.

---

## Pull Requests

### Before you open a PR

Go through this checklist:

- [ ] My branch is up to date with `main`
- [ ] I've added or updated tests for my changes
- [ ] All existing tests pass locally (`npm test` / `bundle exec rspec`)
- [ ] My code follows the project's linting rules (`npm run lint`)
- [ ] I've updated documentation if any APIs, props, or behaviors changed
- [ ] The PR targets `main`, not `develop`

### Writing a good PR description

A clear description speeds up review significantly. Include:

1. **What** — a one-line summary of the change
2. **Why** — context, link to the issue (`Closes #<id>`)
3. **How** — a brief note on your approach, especially if non-obvious
4. **Screenshots / recordings** — required for UI changes

### What reviewers look for

- **Correctness** — does it solve the right problem without regressions?
- **Test coverage** — are the happy path and edge cases covered?
- **Scope** — does the PR do one thing? Unrelated changes slow review and complicate reverts.
- **Docs** — are user-facing changes reflected in the docs?
- **Code clarity** — is the intent readable without over-commenting?

### After opening a PR

- A maintainer will review within a few business days.
- Address review feedback by pushing new commits — don't force-push to a PR under review.
- Once approved, a maintainer will merge it.

---

## Reporting Bugs

Open a [new bug report](https://github.com/ToolJet/ToolJet/issues/new/choose) using the bug report template. A good report includes:

- A clear, specific title
- Steps to reproduce (be exact — include sample data or config if relevant)
- What you expected vs. what actually happened
- ToolJet version, browser, and OS
- Screenshots or error logs if applicable

---

## Proposing Features

Open a [feature request](https://github.com/ToolJet/ToolJet/issues/new/choose) and describe:

- The problem you're trying to solve
- Your proposed solution
- Any alternatives you considered

> **Before you start building:** open an issue and wait for a maintainer to confirm the feature fits the project's direction. This saves everyone time — it's much easier to align on scope in a comment thread than after a PR is already open.

---

## License

By contributing, you agree that your contributions will be licensed under the [AGPL v3 License](https://www.gnu.org/licenses/agpl-3.0.en.html).

---

## Questions?

Join us on the [#contributors channel on Slack](https://tooljet.com/slack) or email [hello@tooljet.io](mailto:hello@tooljet.io).

---
name: manage-skills
description: Adds, moves, or repairs agent skills in this repo — decides public root vs private EE submodule placement and wires the symlinks so a skill is invokable from repo root in Claude Code, Cursor and Codex. Use when asked to add, create, move, relocate, or rename a skill, or when a skill is not showing up.
---

# Manage skills

Skills live in the private `frontend/ee` submodule by default. A skill goes in the public root only if outside contributors, who have no EE access, are meant to use it.

| Who uses it?                                           | Content lives in                     | Root gets                                               |
| ------------------------------------------------------ | ------------------------------------ | ------------------------------------------------------- |
| Outside contributors too (and the text is public-safe) | `.agents/skills/<name>/`             | `.claude/skills/<name>` link                            |
| The team (default)                                     | `frontend/ee/.agents/skills/<name>/` | `.agents/skills/<name>` + `.claude/skills/<name>` links |

A skill that depends on EE access (files to `ToolJet/tj-ee`, hands off to a private skill, needs the submodules) belongs in `frontend/ee`.

Private skills always go in `frontend/ee`, never `server/ee`, even if backend-flavoured — one home keeps a single link chain. Don't create `server/ee/.agents/`.

## Steps

1. Ask: *is this for outside contributors, and is the text safe on GitHub?* Unless both are yes, it's private.
2. Pick a name that doesn't collide with a loaded plugin skill (e.g. `superpowers:test-driven-development`); otherwise prefix `tj-` or pick a domain name. Private names show in the public repo via link targets — keep them non-revealing.
3. Create `<home>/<name>/SKILL.md` with frontmatter `name` and `description` (third person, what it does + when to trigger, one paragraph). Cite shared material by repo-root path, e.g. `frontend/ee/.agents/skills/_shared/investigation-templates.md`.
4. Run `scripts/sync-skills.sh` from repo root — creates missing links, removes stale ones.
5. Verify: `ls -L .claude/skills/<name>/SKILL.md` resolves from repo root. The script won't overwrite a real directory, so a name taken by a public skill fails loudly — pick another.
6. Private skill → commit content in `frontend/ee` first, then links + submodule pointer in root (`commit` skill handles the order).

## Moving or renaming

`git mv` the directory to its new home or name, run `scripts/sync-skills.sh` (removes stale links, adds new ones), then `git add .agents/skills .claude/skills`.

## Skill not showing up

1. `ls -L .claude/skills/<name>/SKILL.md` — missing link → run `scripts/sync-skills.sh`.
2. Link resolves but harness still blind → private skill on a clone without `frontend/ee` checked out, or the harness session predates the link (restart it).

## Rules

- Never create `.claude/`, `.cursor/` or `.codex/` inside a submodule — harnesses scope nested dirs to that subtree and surface duplicates.
- `_shared/` is reference material, not a skill; it is never linked.
- A dangling root link (EE not checked out) is expected on OSS clones and is silently skipped.
- Pre-commit runs `scripts/sync-skills.sh --check`; if it fails, run the script and stage the links.

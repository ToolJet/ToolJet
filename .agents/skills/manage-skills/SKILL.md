---
name: manage-skills
description: Add, move, or repair agent skills in this repo — decide public root vs private EE submodule placement and wire the symlinks so a skill is invokable from repo root in Claude Code, Cursor and Codex. Use when asked to add, create, move, relocate, or rename a skill, or when a skill is not showing up.
---

# Manage skills

Skills live in the private `frontend/ee` submodule by default. A skill goes in the public root only if outside contributors, who have no EE access, are meant to use it.

| Who uses it?                                           | Content lives in                     | Root gets                                               |
| ------------------------------------------------------ | ------------------------------------ | ------------------------------------------------------- |
| Outside contributors too (and the text is public-safe) | `.agents/skills/<name>/`             | `.claude/skills/<name>` link                            |
| The team (default)                                     | `frontend/ee/.agents/skills/<name>/` | `.agents/skills/<name>` + `.claude/skills/<name>` links |

A skill that depends on EE access belongs in `frontend/ee`. That includes skills that file to `ToolJet/tj-ee`, hand off to a private skill, or need the submodules checked out.

Private skills always go in `frontend/ee`, never `server/ee`, even if backend-flavoured. Skills are not code, and one home keeps a single link chain. `server/ee` has no `.agents/`, so don't create one.

## Steps

1. Ask: *is this for outside contributors, and is the text safe on GitHub?* Unless both are yes, it's private.
2. Pick a name. Check it does not collide with a plugin skill already loaded (e.g. `superpowers:test-driven-development`); prefix with `tj-` or pick a domain name if it does. Private names are still visible in the public repo via link targets — keep them non-revealing.
3. Create `<home>/<name>/SKILL.md` with frontmatter `name` and `description` (description = when to trigger, one paragraph). Cite shared material by repo-root path, e.g. `frontend/ee/.agents/skills/_shared/investigation-templates.md`.
4. Run `scripts/sync-skills.sh` from repo root. It creates every missing link and removes stale ones.
5. Verify: `ls -L .claude/skills/<name>/SKILL.md` resolves from repo root. The script refuses to overwrite a real directory, so a name already used by a public skill fails loudly — pick another name.
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

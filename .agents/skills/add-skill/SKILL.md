---
name: add-skill
description: Create a new agent skill in the right place (public root vs private EE submodule) and wire the symlinks so it is invokable from repo root in Claude Code, Cursor and Codex. Use when asked to add, create, or move a skill.
---

# Add a skill

Skill placement is decided by **sensitivity**, not by which code the skill touches.

| Would we mind this text on GitHub? | Content lives in | Root gets |
|---|---|---|
| No (public) | `.agents/skills/<name>/` | `.claude/skills/<name>` link |
| Yes (private) | `frontend/ee/.agents/skills/<name>/` | `.agents/skills/<name>` + `.claude/skills/<name>` links |

Private skills always go in `frontend/ee`, even if backend-flavoured — skills are not code, one home is enough.

## Steps

1. Ask: *would we mind this skill text on GitHub?* If unsure, treat as private.
2. Pick a name. Check it does not collide with a plugin skill already loaded (e.g. `superpowers:test-driven-development`); prefix with `tj-` or pick a domain name if it does. Private names are still visible in the public repo via link targets — keep them non-revealing.
3. Create `<home>/<name>/SKILL.md` with frontmatter `name` and `description` (description = when to trigger, one paragraph). Cite shared material by repo-root path, e.g. `frontend/ee/.agents/skills/_shared/investigation-templates.md`.
4. Run `scripts/sync-skills.sh` from repo root. It creates every missing link and removes stale ones.
5. Verify: `ls -L .claude/skills/<name>/SKILL.md` resolves from repo root. The script refuses to overwrite a real directory, so a name already used by a public skill fails loudly — pick another name.
6. Private skill → commit content in `frontend/ee` first, then links + submodule pointer in root (`commit` skill handles the order).

## Rules

- Never create `.claude/`, `.cursor/` or `.codex/` inside a submodule — harnesses scope nested dirs to that subtree and surface duplicates.
- `_shared/` is reference material, not a skill; it is never linked.
- A dangling root link (EE not checked out) is expected on OSS clones and is silently skipped.
- Pre-commit runs `scripts/sync-skills.sh --check`; if it fails, run the script and stage the links.

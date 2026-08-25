# Module AGENTS.md template

Copy this into `src/modules/<module>/AGENTS.md` and fill it in. Keep the file ≤80 lines: invariants and pointers, not prose. Update it in the same PR whenever the module meaningfully changes — stale context is worse than no context.

---

```markdown
# <module> module

<One-paragraph purpose: what domain concept this module owns, in glossary terms (see /UBIQUITOUS_LANGUAGE.md).>

## Domain terms

- **<Term>** — <meaning in this module, mapped to the glossary>

## Key files

| File | Role |
|---|---|
| `module.ts` | <registration notes, conditional providers> |
| `service.ts` | <main responsibilities> |
| `repository.ts` | <notable query methods> |
| `controllers/...` | <endpoints overview> |

## Edition split

- EE override: `server/ee/<module>/` — <what EE adds/overrides; which services extend CE>
- <License/feature flags gating behavior, if any>

## Invariants & gotchas

- <Things that must stay true; ordering constraints; non-obvious coupling; past bug traps>

## Related modules

- `<module>` — <why coupled>
```

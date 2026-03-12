# AI-Friendly Frontend — Brainstorm in Progress

> Status: **IN PROGRESS** — Resume from Step 2 (clarifying questions)
> Started: 2026-03-10

---

## Goal

Make ToolJet's frontend AI-friendly so developers can leverage Claude Code effectively for:
- Following consistent coding patterns
- Following a design system (Rocket — in progress, PR #14498)
- Auditing component and widget architecture
- Sharing the workflow with the whole company

---

## Context Gathered

### Repo
- Branch: `lts-3.16` (main development is `develop`)
- Frontend: `frontend/src/` — **1474 JSX/TSX files**, no CLAUDE.md, no coding standards doc
- Existing Rocket design system: `components/ui/Rocket/` (shadcn + Tailwind), PR #14498

### What was installed
Installed into `.claude/` from [everything-claude-code](https://github.com/affaan-m/everything-claude-code):
- **Skills**: `frontend-patterns`, `tdd-workflow`, `security-review`, `e2e-testing`, `database-migrations`, `postgres-patterns`
- **Commands**: `/plan`, `/tdd`, `/code-review`, `/verify`, `/e2e`, `/refactor-clean`, `/build-fix`
- **Agents**: `code-reviewer`, `security-reviewer`, `architect`, `database-reviewer`

### Frontend structure
```
frontend/src/
├── AppBuilder/        # Core app builder (canvas, query panel, left sidebar, header)
├── _components/       # Shared UI components (~51 files)
├── components/ui/     # Rocket design system (shadcn primitives + blocks)
├── _hooks/            # Shared hooks
├── _stores/           # State management
├── _services/         # API services
├── HomePage/          # Apps page
├── MarketplacePage/
└── ...
```

---

## Brainstorming Progress

### Q1 — Target audience
**Who are the primary users of this AI workflow?**
→ **Answer: C — Both. Internal team first, then open-source contributors once stable.**

### Q2 — Biggest pain point (NOT YET ANSWERED)
**What's the biggest daily pain point for your developers right now?**
- A) No consistent component patterns — everyone writes things differently
- B) No design system — UI looks inconsistent, devs make visual decisions ad-hoc
- C) No AI context — Claude doesn't know ToolJet's architecture so suggestions are generic/wrong
- D) All three equally

**→ RESUME HERE: User needs to answer Q2**

---

## Next Steps After Brainstorming

Once all questions answered, will propose 2-3 approaches for:
1. `CLAUDE.md` at repo root + `frontend/CLAUDE.md`
2. ToolJet-specific skills (widget patterns, datasource patterns, design system compliance)
3. Team onboarding workflow (how other devs activate and use this)
4. Design system codification (coding standards doc + skill)

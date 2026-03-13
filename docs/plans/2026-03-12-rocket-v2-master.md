# Rocket v2 — Master Planning Document

> Status: **PLANNING** — architecture decided, foundation not yet built
> Started: 2026-03-10 | Updated: 2026-03-12
> Supersedes: `2026-03-11-rocket-v2-design-system.md` (archived)
> Vision reference: `2026-03-10-ai-friendly-frontend-brainstorm.md`

---

## What Is This

**Rocket** is ToolJet's design system — a HOC wrapper layer over shadcn/Radix primitives, mapped to ToolJet's design tokens, with full light/dark theme support and Storybook stories.

**Katana** is the collection of Claude Code skills that automate building Rocket. Skills live in `.claude/skills/` (project context). After the design system is stable, they'll be extracted to the official `tooljet/tooljet-katana` repo.

This document is the single source of truth for all planning, decisions, and current status.

---

## Architecture

### Layer stack

```
shadcn/Radix primitives      → src/components/ui/Rocket/shadcn/
                                  ↓ never hand-edited, installed via CLI only
Rocket HOC wrappers          → src/components/ui/Rocket/{Name}/{Name}.jsx
                                  ↓ ToolJet prop API + ToolJet tokens + CVA
Blocks                       → src/components/ui/blocks/
                                  ↓ composed UI (DataTable, ResourceCard, etc.)
Features / Pages             → src/features/<name>/
```

### Rules

| Concern | Decision |
|---|---|
| shadcn install path | `src/components/ui/Rocket/shadcn/` — update `components.json` `"ui"` alias |
| Rocket HOC path | `src/components/ui/Rocket/{Name}/{Name}.jsx` |
| Barrel export | `src/components/ui/Rocket/index.js` |
| Stories | Co-located: `src/components/ui/Rocket/{Name}/{Name}.stories.jsx` |
| Token source | `src/_styles/componentdesign.scss` — single source of truth |
| Tailwind token usage | ToolJet token classes (`tw-bg-button-primary`) — never shadcn semantic classes (`tw-bg-primary`) |
| shadcn token bridging | Override `--primary`, `--background`, etc. in `componentdesign.scss` → point to our vars so Radix internals get correct colours |
| Dark mode class | `.dark-theme` (ToolJet convention) |
| Tailwind dark modifier | `darkMode: ['class', '[class~="dark-theme"]']` — needs fixing in tailwind.config.js |
| `globals.css` | NOT loaded in production — leave for shadcn CLI compat only; add new CSS vars to componentdesign.scss instead |
| Simple primitives (Button, Badge) | CVA + Radix Slot directly — no shadcn layer needed |
| Complex interactive (Select, Dialog, Tooltip…) | Install shadcn primitive → wrap in Rocket HOC |
| Component approach | `forwardRef`, `PropTypes`, `displayName`, CVA for variants |
| `cn()` utility | Already at `@/lib/utils` (classnames + tailwind-merge with tw- prefix) |

### Tailwind v3.4 prefix rules

```
Modifiers (hover:, dark:, md:, group-data-[...]:)  → NO tw- prefix
Utility classes (flex, bg-blue-500)                 → ALWAYS tw- prefix
Complex data selectors ([[data-sidebar=...]])        → correct as-is
Important modifier                                  → !tw-h-8  (! before tw-, NOT tw-h-8!)
Negative utilities                                  → -tw-ml-1
```

---

## Token System

**Source:** `frontend/src/_styles/componentdesign.scss`
**Loaded:** after Tailwind utilities in `theme.scss` — overrides everything

### What exists (comprehensive)
- Page, background (surface layers 01/02/03, accent, success, warning, error, inverse)
- Text (default, medium, placeholder, inverse, brand, selected, semantic states, disabled)
- Icon (strong, default, weak, inverse, on-solid, brand, semantic states, disabled)
- Border (strong, default, weak, semantic states, disabled)
- Interactive overlays (weak, default, hover, selected, disabled, focus-outline, focus-inner-shadow)
- Button (primary, secondary, outline, danger-primary, danger-secondary — all states)
- Controls (switch-tab, switch-tag, switch-background-off/on, slider)
- Upgrade tokens
- Elevation shadows (000–700), light + dark

### Needs to be added (Phase 0 task)
- Radius tokens: `--radius-sm: 4px`, `--radius-md: 6px`, `--radius-lg: 8px`, `--radius-xl: 12px`, `--radius-full: 9999px`
- Overlay backdrop: `--overlay-backdrop: rgba(0, 0, 0, 0.5)`
- shadcn semantic bridges: `--background`, `--foreground`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--radius`, `--popover`, `--card`, `--sidebar-*`
- Add corresponding `borderRadius` entries to `tailwind.config.js` so `tw-rounded-sm/md/lg` work

### Dark theme
`.dark-theme` class on body/wrapper — all tokens have dark overrides in `componentdesign.scss`.
Storybook decorator already applies `.dark-theme` when dark background is selected. ✅

---

## Codebase Facts

```
frontend/tailwind.config.js          Tailwind v3.4, prefix: tw-, darkMode: ['class'] ← BROKEN
frontend/src/_styles/componentdesign.scss   Token source of truth
frontend/src/_styles/theme.scss      Main SCSS entry — imports componentdesign.scss after Tailwind
frontend/src/lib/utils.js            cn() — classnames + tailwind-merge with tw- prefix ✅
frontend/components.json             shadcn config: style=new-york, tsx=false, tw- prefix
                                     "ui" alias = @/components/ui ← needs updating
frontend/src/styles/globals.css      shadcn-generated (Tailwind v4 syntax) — not loaded in app
frontend/.storybook/main.js          Scans src/**/*.stories.@(js|jsx|...) — co-located stories work ✅
frontend/.storybook/decorators.jsx   withColorScheme sets .dark-theme on dark bg ✅
```

Already installed — no need to add:
- `class-variance-authority`, `classnames`, `tailwind-merge`, `@radix-ui/react-slot`, `lucide-react`

---

## Foundation Setup (not yet done)

These are the config-only changes required before any component can be written. No component code.

| # | Task | File | What changes |
|---|---|---|---|
| 1 | Install shadcn/ui skill | — | `pnpm dlx skills add shadcn/ui` in `frontend/` |
| 2 | Create branch | — | `design/rocket-v2` from `lts-3.16` |
| 3 | Fix dark mode selector | `tailwind.config.js` | `darkMode: ['class', '[class~="dark-theme"]']` |
| 4 | Fix token typo | `tailwind.config.js` | `background-warning-stong` → `background-warning-strong` |
| 5 | Add missing tokens | `componentdesign.scss` | Radius, overlay, shadcn bridges (light + dark) |
| 6 | Add borderRadius | `tailwind.config.js` | `tw-rounded-sm/md/lg/xl` tokens |
| 7 | Update shadcn alias | `components.json` | `"ui": "@/components/ui/Rocket/shadcn"` |
| 8 | Create ARCHITECTURE.md | `Rocket/shadcn/ARCHITECTURE.md` | "Never edit this directory" guard |
| 9 | Create barrel | `Rocket/index.js` | Public API export |
| 10 | Verify Storybook | — | `npm run storybook` — confirm it starts, dark mode toggle works |

Each task = one commit.

---

## Skills

Skills live in `.claude/skills/` (project context). Will move to `tooljet/tooljet-katana` repo later.

### ✅ Done

| Skill | What it does |
|---|---|
| `create-widget` | PRD → schema files + 14 registration edits |
| `create-widget-ui` | Schema → wired JSX/SCSS stub |
| `shadcn-to-v3` | Converts shadcn-installed (v4) components to Tailwind v3.4 with tw- prefix. Runs after every `shadcn add`. |

### ❌ Needs to be written

| Skill | What it does | Depends on |
|---|---|---|
| `create-rocket-component` | Interactive: name + optional Figma URL → shadcn install → v3 convert → Rocket HOC + stories | `shadcn-to-v3`, Figma MCP |

### 🔲 Planned (Month 2+)

| Skill | What it does |
|---|---|
| `design-audit` | PR design system compliance check |
| `widget-migrate` | Migrate existing widget to use Rocket components |
| `rocket-maintainer` | Design system health report |

---

## `create-rocket-component` Skill — Spec

This is the main remaining planning deliverable.

### What it does

```
Input: component name (+ optional Figma node URL)
         ↓
1. npx shadcn@latest add {component}     if a shadcn primitive exists for it
         ↓
2. [shadcn-to-v3 skill]                  converts v4 syntax → v3.4 + tw- prefix
         ↓
3a. [Figma MCP] read node → extract      if Figma URL provided
    variants, sizes, states, props
3b. Interactive prompts                  if no Figma URL
    - What variants? (primary, secondary…)
    - What sizes? (sm, default, lg…)
    - What states? (disabled, loading, error…)
    - Special features? (leading icon, clearable…)
         ↓
4. Generate Rocket/{Name}/{Name}.jsx     CVA + forwardRef + PropTypes + ToolJet tokens
         ↓
5. Generate {Name}.stories.jsx           one story per variant + states + sizes
         ↓
6. Update Rocket/index.js                add export
         ↓
Output: checklist of manual TODOs
```

### Open question — Figma MCP

The skill needs Figma MCP to read component specs. **Status: MCP added by user, not yet verified in session.** Need to confirm in a fresh session what tools are available and what the Figma MCP returns (node structure, variants, properties).

Until confirmed, the skill should have a graceful fallback: if no Figma MCP available, use interactive prompts for variant/state collection.

---

## What Happens After Foundation

Once foundation is set and `create-rocket-component` skill works:

1. Run `/create-rocket-component` for each component in order
2. Each generates a HOC + stories
3. Each gets its own PR
4. Blocks and features consume Rocket components

**Rough component order** (driven by what gets built first in Blocks/Features):
Button → Badge → Input → Select → Checkbox → Switch → Tooltip → Dialog → Popover → Tabs → …

The exact order is driven by what Blocks and Features need — we don't build components speculatively.

---

## Open Questions

| Question | Status |
|---|---|
| Figma MCP — what tools does it expose? What does a node lookup return? | ✅ Verified 2026-03-13 — documented in skill + `memory/feedback_figma_mcp.md` |
| `lts-3.16` — available locally as remote branch? | ✅ Confirmed locally, `design/rocket-v2` branched from it |
| Storybook Tailwind CSS processing — is PostCSS set up in Storybook webpack? | ✅ Fixed — MiniCssExtractPlugin → style-loader in `.storybook/main.js` |
| Motion tokens — when? | Deferred to after first 5 components |

---

## Session Status

| Item | Status |
|---|---|
| Architecture decisions | ✅ Complete |
| Token audit | ✅ Complete |
| `shadcn-to-v3` skill | ✅ Written, in project context |
| Foundation setup | ✅ Complete (2026-03-13) — 10 commits on `design/rocket-v2` |
| `create-rocket-component` skill | ✅ Written — spec-file pattern, 4 CVA shapes, Figma MCP documented |
| Figma MCP | ✅ Verified working (2026-03-13) |
| Memory updated | ✅ Current |
| **Next** | `/create-rocket-component` → Button |

# ToolJet Katana — Vision & 6-Month Plan

> Status: **VISION DRAFT** — v0.1, initial capture
> Started: 2026-03-10 | Updated: 2026-03-11
> This document is the starting point. Katana = sharp tools for the ToolJet team.

---

## The Problem We're Solving

Design systems at most companies die the same death: designers spend months creating component libraries with do's, don'ts, and philosophy docs. Engineers can't read all of it, don't follow it consistently, and the gap widens with every PR. The effort gets wasted. The inconsistency compounds.

The observation: **a design system is only as good as the enforcement mechanism.** Without enforcement, it's just documentation. With AI, we can make enforcement automatic, real-time, and conversational — not punitive.

**Katana is the answer to that.** A collection of Claude Code skills that:
1. Help developers build ToolJet features correctly the first time
2. Help design engineers build and maintain the component library with AI
3. Enforce the design system and coding standards on every PR — automatically

---

## What's Already Shipped

| Skill | Status | What it does |
|---|---|---|
| `create-widget` | ✅ Shipped, tested | PRD → schema files + ~14 registration edits (6 phases, interactive) |
| `create-widget-ui` | ✅ Shipped, tested | Schema → wired UI stub (JSX + SCSS + Inspector sections) |

These are the proof-of-concept. They work. Now we build the rest of the system around them.

---

## Pillar 1 — Rocket Design System Architecture Rethink

### The Problem with PR #14498

The current PR directly copies and modifies shadcn components. This creates a maintenance trap:

- `npx shadcn@latest add button --overwrite` would destroy all our customizations
- shadcn components can never be updated independently
- Every bug fix or accessibility improvement from upstream shadcn requires manual merging
- The layer boundaries between "shadcn primitive" and "Rocket component" are invisible

### The Right Architecture: Rocket as a Wrapper Layer

shadcn components are **source material**, not **source code**. We install them untouched and wrap them.

```
┌─────────────────────────────────────────────────────┐
│  shadcn/ui  (installed via CLI, NEVER manually edited)│
│  components/ui/button.tsx                            │
│  components/ui/input.tsx  ...                        │
└─────────────────┬───────────────────────────────────┘
                  │ import as-is
┌─────────────────▼───────────────────────────────────┐
│  Rocket  (our design system — HOC wrappers)          │
│  components/ui/Rocket/Button.jsx                     │
│  components/ui/Rocket/Input.jsx  ...                 │
│                                                      │
│  Maps: ToolJet props → shadcn props                  │
│  Applies: ToolJet design tokens (--cc-* vars)        │
│  Adds: ToolJet-specific variants, sizes, behaviors   │
└─────────────────┬───────────────────────────────────┘
                  │ import from Rocket
┌─────────────────▼───────────────────────────────────┐
│  Blocks  (composed UI — DataTable, ResourceCard etc) │
│  Widgets (ToolJet app builder components)            │
└─────────────────────────────────────────────────────┘
```

**What this buys us:**
- shadcn can be updated anytime: `npx shadcn@latest add button --overwrite` → safe
- Rocket layer is purely additive: it can't be broken by shadcn upgrades
- Clear contract: Rocket exposes ToolJet's API; shadcn is an implementation detail
- Widgets consuming Rocket components get upgrades for free when Rocket improves

### HOC Pattern in Practice

```jsx
// components/ui/button.tsx  — shadcn raw, never touched
// (installed via CLI)

// components/ui/Rocket/Button.jsx  — our wrapper
import { Button as ShadcnButton } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const variantMap = {
  primary: 'default',
  secondary: 'outline',
  ghost: 'ghost',
  destructive: 'destructive',
};

export const Button = ({ variant = 'primary', size = 'md', className, ...props }) => (
  <ShadcnButton
    variant={variantMap[variant]}
    size={size}
    className={cn('tw-font-medium', className)}
    {...props}
  />
);
```

**Key rules:**
- Rocket components expose ToolJet's design language (our prop names, our variant names)
- The mapping to shadcn internals lives only in the Rocket wrapper
- ToolJet tokens (`--cc-*` CSS vars) are applied inside Rocket, never hard-coded in consumers
- Props that ToolJet doesn't need are not exposed (keep the API narrow)

### Migration Plan: One Component Per PR

Current PR #14498 is too large to merge cleanly. We re-approach it as a sequence of focused PRs, migrating one component at a time to the new HOC architecture.

**Order (tentative — driven by usage frequency):**
1. Button
2. Input / Textarea
3. Badge
4. Select / Dropdown
5. Dialog / Modal
6. Tooltip
7. Checkbox / Radio / Switch
8. Tabs
9. Avatar
10. Table primitives

Each PR: install shadcn primitive → write Rocket HOC → write Storybook story → raise PR.
A skill (`create-rocket-component`) will automate steps 1–4.

---

## Pillar 2 — Katana Skills Repository

**Repo:** `tooljet/tooljet-katana` (public GitHub repo)

Anyone at ToolJet (or OSS contributor) clones it and runs `install.sh` to add skills to their Claude Code setup. Sharp tools for sharp engineers.

### Repository Structure

```
tooljet-katana/
├── README.md
├── install.sh                          # cp -r skills/* ~/.claude/skills/
│
├── skills/
│   │
│   ├── # ── DEVELOPER TOOLS ─────────────────────────────────
│   ├── create-widget/                  # ✅ shipped
│   ├── create-widget-ui/               # ✅ shipped
│   ├── widget-audit/                   # audit existing widget schema
│   ├── datasource-patterns/            # datasource plugin conventions
│   │
│   ├── # ── DESIGN SYSTEM TOOLS ─────────────────────────────
│   ├── create-rocket-component/        # Figma → shadcn → Rocket HOC
│   ├── design-audit/                   # file/PR compliance audit
│   ├── rocket-maintainer/              # design system health agent
│   │
│   ├── # ── PLATFORM / ONBOARDING ───────────────────────────
│   └── tooljet-context/                # seed Claude with ToolJet architecture
│
├── commands/
│   ├── pr-design-audit.md              # /pr-design-audit — run on open PR
│   ├── rocket-status.md                # /rocket-status — component coverage report
│   └── widget-migrate.md              # /widget-migrate — migrate widget to Rocket components
│
├── hooks/
│   └── pre-pr-design-check.sh         # Claude Code hook: auto-audit on commit
│
└── docs/
    ├── widget-schema-field-types.md    # canonical widget schema reference
    ├── rocket-architecture.md          # HOC pattern, rules, examples
    ├── design-tokens.md               # --cc-* token reference
    └── contributing.md
```

---

## Pillar 3 — PR Design Audit (Design System Enforcement)

This is the most important idea in this whole document.

### The Insight

A design system isn't effective if engineers have to remember to check it. The check must happen automatically, be conversational, and explain *why* something is a violation — not just flag it.

### How It Works

Every frontend PR in ToolJet triggers a design audit. Claude Code runs `design-audit` on the changed files and posts a structured comment:

```
Design Audit — PR #14523

✅ Passes: 8 checks
⚠️  Warnings: 2 issues found
❌ Violations: 1 critical issue

CRITICAL
  src/AppBuilder/Widgets/NewWidget/NewWidget.jsx:47
  Hardcoded color `#1F2937` — use CSS var `--cc-neutral-800` or Rocket token
  → Replace with: className="tw-text-neutral-800" or style={{ color: 'var(--cc-neutral-800)' }}

WARNINGS
  src/AppBuilder/Widgets/NewWidget/NewWidget.jsx:23
  Button rendered as <button> — use <Button> from Rocket component library

  src/AppBuilder/Widgets/NewWidget/NewWidget.jsx:91
  Dark mode handled via conditional className — use CSS var that responds to theme automatically
```

### What It Checks (Scope)

**Design system compliance:**
- Hardcoded colors, spacing, border-radius values → should be CSS vars or Tailwind tokens
- Raw HTML elements (`<button>`, `<input>`, `<select>`) where a Rocket component exists
- Incorrect token usage (e.g. using `--primary` instead of `--cc-primary-600`)
- Dark mode handled incorrectly (inline conditionals, body class checks)

**Coding standards:**
- `console.log` in render paths
- `Math.random()` in render (breaks SSR / hydration)
- PropTypes without `.shape()` definitions
- Inline styles for values that should be tokens

**Rocket-specific patterns:**
- CVA `className` passed inside the call (override silently broken)
- `tw-` prefix missing on Tailwind classes in components that require it
- `data-slot` collisions between related components

**Architecture:**
- Mock data or setTimeout imported into production components
- `document.body.classList` access in render / useState initializer
- MutationObserver for theme detection (should be React context)

### Integration Options (in priority order)

1. **Manual** — developer runs `/pr-design-audit` locally before pushing (immediate, no CI needed)
2. **Claude Code hook** — pre-commit hook that runs audit on staged files (fast feedback loop)
3. **GitHub Action** — Claude Code runs audit on PR open/update, posts as PR review comment
4. **Block merge** — if critical violations exist, CI fails (strictest mode, opt-in per repo)

We start with 1 and 2. 3 is the 3-month goal. 4 is optional.

---

## Pillar 4 — create-rocket-component Skill (Design → Code)

### The Problem
Currently going from Figma design → correct Rocket component requires a designer or engineer to:
1. Read the Figma comp
2. Find the right shadcn primitive
3. Install it
4. Write the HOC wrapper
5. Match ToolJet tokens
6. Write a story
7. Write the PR

This is slow, error-prone, and requires deep knowledge of both Figma and the codebase.

### The Skill

`create-rocket-component` uses the Figma MCP to read component specs and generates the correct HOC wrapper automatically.

**Flow:**
1. Engineer provides Figma component URL or node ID
2. Skill reads the component via Figma MCP: variants, props, visual tokens, states
3. Skill identifies the matching shadcn primitive (or flags if none exists)
4. Skill installs the shadcn primitive: `npx shadcn@latest add {component}`
5. Skill generates the Rocket HOC wrapper, mapping Figma variants → shadcn variants → ToolJet tokens
6. Skill generates a Storybook story with all variants from Figma
7. Skill outputs PR-ready files with a checklist of manual TODOs (visual verification, edge cases)

**Output:**
```
components/ui/{ShadcnPrimitive}.tsx    — installed, untouched
components/ui/Rocket/{Name}.jsx        — HOC wrapper, token-mapped
components/ui/Rocket/{Name}.stories.jsx — all Figma variants covered
```

### The Bigger Idea: AI-Friendly Design Markup

Longer term, this skill could consume a structured design intent format — a light DSL that designers can write (or Figma plugins can export) that expresses component intent without code:

```yaml
# rocket-component.yaml
component: Button
figma: https://figma.com/file/.../Button
shadcn_primitive: button

variants:
  - name: primary
    figma_variant: "Type=Primary, State=Default"
    token_map:
      background: --cc-primary-600
      text: --cc-white
      border: none
  - name: secondary
    figma_variant: "Type=Secondary, State=Default"
    token_map:
      background: transparent
      text: --cc-primary-600
      border: --cc-primary-600

sizes:
  - sm: { height: 32px, font: tw-text-sm, padding: tw-px-3 }
  - md: { height: 40px, font: tw-text-sm, padding: tw-px-4 }
  - lg: { height: 48px, font: tw-text-base, padding: tw-px-6 }

states:
  - hover: { background: --cc-primary-700 }
  - disabled: { opacity: 0.5, cursor: not-allowed }
  - loading: { show_spinner: true }
```

The AI reads this file + Figma MCP → generates a perfectly token-compliant HOC. Designers can write/edit these without touching code. Engineers review the generated output.

This is still an idea to validate. But it points at the right thing: **the design intent should be machine-readable, not locked in a Figma comment**.

---

## Pillar 5 — Widgets Consuming Rocket (Long Game)

Currently ToolJet widgets are self-contained — they render their own HTML, manage their own styles. Long-term, widgets should consume Rocket components internally.

**Why this matters:**
- When Rocket Button improves (accessibility, dark mode, animation), all widgets using it improve automatically
- Designers can update a token once and it propagates everywhere
- Widget customization still works because Rocket components accept `className` and style overrides from widget props

**The contract:** Rocket components must remain customizable by external inputs. They are not sealed. Widget schemas drive visual customization via ToolJet's expression engine → those expressions resolve to values that flow into Rocket component props.

```
Widget schema (properties, styles)
  → Expression evaluator (FX fields)
  → Resolved values
  → Props passed to Rocket component
  → Rocket HOC applies ToolJet tokens + shadcn under the hood
  → Rendered output
```

A `widget-migrate` command will help engineers migrate an existing widget to use Rocket components step by step.

---

## Pillar 6 — Rocket Maintainer Agent

A background agent that runs periodically (or on-demand) and produces a design system health report:

**What it checks:**
- Component coverage: which Figma components have a Rocket equivalent, which don't
- Token drift: Rocket components that stopped using the right tokens (after a refactor)
- Storybook coverage: which components have stories, which are missing variants
- Consumer inventory: which features/blocks/widgets use each Rocket component
- Outdated shadcn primitives: which installed shadcn components have upstream updates

**Output:**
```
Rocket Health Report — 2026-03-11

Coverage:   18/34 Figma components have Rocket equivalents (53%)
Token drift: 2 components have hardcoded values (Badge, EmptyResource)
Stories:    12/18 components have Storybook stories
Consumers:  Button used in 47 places, Input in 31 places
Updates:    shadcn/button has 2 upstream commits since our install
```

---

## 6-Month Execution Plan

### Month 1 — Foundation
**Goal: Katana is real. New Rocket architecture is established.**

- [ ] Create `tooljet/tooljet-katana` repo
- [ ] Port `create-widget` and `create-widget-ui` skills with proper READMEs
- [ ] Write `install.sh`
- [ ] Formalize Rocket HOC architecture in `docs/rocket-architecture.md`
- [ ] Branch `design/rocket-v2` off `lts-3.16` (NOT develop)
- [ ] Migrate first 3 Rocket components to HOC pattern (Button, Input, Badge)
- [ ] Raise 3 individual PRs (one per component)
- [ ] Draft `CLAUDE.md` for ToolJet repo root (architecture overview)
- [ ] Draft `frontend/CLAUDE.md` (widget system, Rocket, patterns)

**Milestone:** Any engineer can `git clone tooljet-katana && ./install.sh` and start using `create-widget`.

---

### Month 2 — Design System Workflow
**Goal: create-rocket-component skill ships. Design audit v1 working locally.**

- [ ] Build `create-rocket-component` skill (Figma MCP integration)
- [ ] Migrate 5 more Rocket components (Select, Tooltip, Checkbox, Tabs, Dialog)
- [ ] Build `design-audit` skill v1 (local file/directory audit — no CI yet)
- [ ] Define the full list of audit checks (from PR #14498 review findings)
- [ ] Test design audit against 5 existing frontend files
- [ ] Add `widget-audit` skill — inspect existing widget schema for stale patterns
- [ ] Begin prototyping the AI-friendly design markup format (`.rocket.yaml`)

**Milestone:** Design engineer can Figma MCP URL → working Rocket component in under 10 minutes.

---

### Month 3 — PR Enforcement
**Goal: Design audit runs automatically on every frontend PR.**

- [ ] Build `pr-design-audit` command (runs audit on git diff vs develop)
- [ ] Add pre-commit Claude Code hook for staged files
- [ ] Set up GitHub Action: Claude runs audit on PR, posts structured comment
- [ ] Migrate 5 more Rocket components (Avatar, Table, Card, Popover, Toast)
- [ ] Write Storybook stories for all 13 migrated components
- [ ] Validate `.rocket.yaml` format with 3 real components

**Milestone:** Every frontend PR in ToolJet gets an automated design audit comment. Engineers see violations in PR review, not in production.

---

### Month 4 — Widget Integration Begins
**Goal: First widget is consuming a Rocket component. Pattern is established.**

- [ ] Define the widget → Rocket props contract (how schema values flow to component props)
- [ ] Migrate one widget to use Rocket Button internally (Button widget is obvious candidate)
- [ ] Build `widget-migrate` command to guide engineers through the migration
- [ ] Migrate 5 more Rocket components (Form elements, Slider, Progress)
- [ ] Begin `rocket-maintainer` agent (coverage report + token drift detection)
- [ ] Publish Katana docs: contributing guide, how to write a skill, how to write a Rocket component

**Milestone:** Widget team has a clear pattern for consuming Rocket components. First migrated widget is in production.

---

### Month 5 — Maintainer + AI Design Language
**Goal: Design system is self-auditing. .rocket.yaml is validated as a concept.**

- [ ] `rocket-maintainer` agent ships with full health report
- [ ] `.rocket.yaml` spec v1 finalized based on 3-component prototype
- [ ] `create-rocket-component` v2: reads `.rocket.yaml` instead of just Figma MCP
- [ ] Designers can author `.rocket.yaml` files; skill generates correct HOC from them
- [ ] 25+ Rocket components migrated to HOC pattern
- [ ] All blocks (DataTable, ResourceCard, etc.) migrated to use new Rocket components
- [ ] `datasource-patterns` skill ships

**Milestone:** A designer can express a component's intent in `.rocket.yaml`, hand it to the AI, and get a PR-ready Rocket HOC. No engineering required for the scaffold.

---

### Month 6 — Scale + Community
**Goal: Katana is the standard. OSS contributors can participate.**

- [ ] Full Figma component library coverage in Rocket (all 34 components)
- [ ] Design audit integrated into ToolJet CI — critical violations block merge
- [ ] Katana repo is public with contribution guide
- [ ] Blog post / internal talk: "How we built an AI-powered design system at ToolJet"
- [ ] Team onboarding: every new engineer runs `./install.sh` on day 1
- [ ] `query-patterns` and `frontend-context` skills ship for OSS contributors

**Milestone:** ToolJet's design system enforces itself. Engineers ship compliant UI by default, not by discipline.

---

## Skills Summary (Full Roadmap)

| Skill | Serves | Status | Month |
|---|---|---|---|
| `create-widget` | Engineers | ✅ Shipped | — |
| `create-widget-ui` | Engineers | ✅ Shipped | — |
| `create-rocket-component` | Design engineers | 🔲 Planned | M2 |
| `design-audit` | Everyone | 🔲 Planned | M2 |
| `widget-audit` | Engineers | 🔲 Planned | M2 |
| `rocket-maintainer` | Design engineers | 🔲 Planned | M4 |
| `widget-migrate` | Engineers | 🔲 Planned | M4 |
| `datasource-patterns` | Engineers | 🔲 Planned | M5 |
| `tooljet-context` | Engineers / OSS | 🔲 Planned | M6 |

| Command | Purpose | Month |
|---|---|---|
| `/pr-design-audit` | Run design audit on current branch's diff | M3 |
| `/rocket-status` | Design system coverage + health report | M4 |
| `/widget-migrate` | Step-by-step widget → Rocket migration | M4 |

---

## Open Questions

1. **Figma MCP access** — Do all engineers have Figma access to use the MCP? Or is it design-team-only?
2. **`.rocket.yaml` tooling** — Should this be a Figma plugin that exports it, or do designers write it manually?
3. **Audit strictness** — Do we block PRs on critical violations from day one, or start as advisory-only?
4. **Katana visibility** — Public repo from day one, or internal first until we're confident in the patterns?
5. **Widget migration order** — Which widgets consume Rocket first? (Button widget is the cleanest starting point)
6. **PR #14498 fate** — ✅ DECIDED: Close it. Start fresh with HOC pattern. Reference it when needed (blocks, layouts, token decisions worth keeping).

---

## Principles

1. **AI enforces the design system — not discipline.** Rules that require humans to remember to check them will be broken.
2. **Design systems are component libraries in practice.** Build the code first, let the philosophy emerge from the code.
3. **Sharp tools, not more documentation.** Every Katana skill replaces a page of docs no one reads.
4. **The upgrade path must always be open.** No architecture decision should make shadcn updates impossible.
5. **Widget customizability is non-negotiable.** Rocket components must accept external inputs — we are building a no-code builder.
6. **One PR per component.** Small, reviewable, mergeable. No more 200-file PRs.

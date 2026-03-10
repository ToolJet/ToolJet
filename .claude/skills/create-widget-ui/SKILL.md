---
name: create-widget-ui
description: Use after create-widget to generate the UI stub for a new ToolJet widget. Reads the existing schema file and produces a wired-up Widgets/{Name}/{Name}.jsx with all state hooks, exposed variables, CSAs, and event handlers. Leaves JSX layout as a manual TODO.
---

# ToolJet Widget UI Generator

## Overview

Companion to `create-widget`. Reads `widgets/{camelName}.js` and generates:
- `frontend/src/AppBuilder/Widgets/{Name}/{Name}.jsx` — wired stub
- `frontend/src/AppBuilder/Widgets/{Name}/{Name}.scss` — empty stub
- Updates `Inspector/Components/{Name}/{Name}.jsx` sections[] if it exists (Type C only)

## When to Use

After `create-widget` has run successfully. Invoke with the PascalCase widget name:
```
/create-widget-ui MyWidget
```

## CRITICAL RULES

- NEVER modify schema files (`widgets/*.js`, `widget-config/*.js`)
- STOP if `Widgets/{Name}/` already exists — do not overwrite
- STOP if `widgets/{camelName}.js` not found — `create-widget` must run first
- camelName is derived from the PascalCase Name argument: first letter lowercased (e.g. `MyWidget` → `myWidget`, `DropdownV2` → `dropdownV2`)

## Phase 1 — READ SCHEMA

(to be filled in)

## Phase 2 — GENERATE

(to be filled in)

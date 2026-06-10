---
applyTo: "frontend/src/**/*"
---

# Frontend TypeScript — File Creation Rules

## File Extension Rules

- All new files created under `frontend/src/` MUST use `.tsx` or `.ts` extensions.
- `.jsx` and `.js` files are legacy and must NOT be added.
- If a file contains JSX, use `.tsx`. If it is logic-only with no JSX, use `.ts`.

## Enforcement

Flag any newly created file under `frontend/src/` that uses a `.js` or `.jsx` extension. The file must be:

- Rewritten in TypeScript with proper types — not just renamed.
- All props, function parameters, return types, and state variables must be explicitly typed.
- Avoid using `any` — use specific types, interfaces, or generics instead.
- Define interfaces or types for component props, API responses, and shared data shapes.

A file that has been renamed to `.ts`/`.tsx` but still lacks type annotations is not compliant.

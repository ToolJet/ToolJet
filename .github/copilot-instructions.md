# ToolJet — Shared Copilot Instructions

## Styling

- Tailwind classes MUST use the `tw-` prefix (e.g., `tw-flex`, `tw-text-default`). Unprefixed Tailwind is a bug.
- NEVER hardcode hex/rgb colors. Use CSS variable tokens via Tailwind (`tw-text-default`, `tw-bg-page-default`) or `var(--text-default)`.
- Prefer Tailwind over Bootstrap for new code. Do not extend legacy `react-bootstrap` usage.
- Use custom typography utilities (`tw-font-title-default`, `tw-font-body-default`, etc.) instead of ad-hoc font-size/weight.
- Design tokens: `frontend/src/_styles/designtheme.scss` + `frontend/tailwind.config.js`.

## Component Patterns

- Check `frontend/src/_ui/` (53+ components) before creating new UI components.
- Functional components with hooks only. No class components.
- File structure: `ComponentName/index.js` + optional `ComponentName.jsx` + `style.scss`.
- Compose with Radix UI primitives for accessible interactive elements.

## Imports

- Use `@/` path alias (maps to `frontend/src/`): `import Button from '@/_ui/Button'`.
- No deep relative paths (`../../..` is a smell).

## State Management

- Zustand with Immer middleware only. No Redux/MobX/Recoil.
- Use `shallow` comparison in `useStore` when selecting objects/arrays. Flag missing `shallow`.

## Icons & Assets

- Use Tabler Icons (`@tabler/icons-react`) or Lucide React (`lucide-react`). Do NOT add new icon packages.
- Static assets: `frontend/assets/images/`.

## Security

- No API keys/secrets in client-side code.
- Backend: parameterized queries only, never concatenate user input into SQL.

## Common Review Flags

- Hardcoded colors (hex/rgb/hsl in JSX or SCSS)
- Missing `tw-` prefix on Tailwind classes
- New `react-bootstrap` imports
- Class components
- `console.log` / debug leftovers
- Unused imports
- Missing `key` props in `.map()`
- Missing `shallow` in `useStore` selectors
- Direct DOM manipulation (except canvas drop calculations)

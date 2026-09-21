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

## Tests

Rules: `.github/instructions/frontend-tests.instructions.md`. How to write one:
`frontend/src/test/README.md`. Reject any spec that would still pass against broken
production code. Specs are exempt from the TypeScript-only file rule.

- **A spec must reach the code it covers.** The first check on any spec: it must reach
  the changed production file by a direct import, by the real composed store (which
  reaches every slice), or via `widgetHarness`. Reaching it through none of those —
  because the spec stands up its own fake — is a reject however many assertions it has.
  Going through the store or harness rather than naming the file is normal and correct.
- **Never reimplement production logic in a spec** — not in a `jest.mock` factory, a
  local `buildMockStore`/`createMockStore` helper, or a `createStore(...)` seeded with
  hand-written state (`createStore` against a real slice factory is fine). Never mock
  or hand-roll the App Builder store to test store behaviour — use the real composed
  store via `seedApp()` / `AppBuilderTestSession` / `createWidgetHarness()`. "The real
  store is too much setup" is not a reason.
- **Fake HTTP only at the MSW boundary**; assert on the store, never on a mock.
  Assertions must match the real signature — a void action returns `undefined`.
- **Reject assertion-free specs and tautological assertions.** A bug fix ships with a
  spec that was red before the fix.
- **Name specs `*.spec.[jt]s(x)` inside a `__tests__/` directory** or jest never runs
  them. Imports the real store → `__tests__/integration/`, else `__tests__/`. Placement
  passing `test:layout` is not evidence a spec is correct.
- **Widget specs use `createWidgetHarness()`** and may only assert on properties and
  events the widget's schema declares.

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
- A spec that reaches the changed code through neither a direct import nor the real
  store/harness, because it stands up its own fake
- Production logic reimplemented in a spec — `jest.mock` factory, `buildMockStore`-style
  helper, or a `createStore(...)` filled with hand-written state
- A mocked or hand-rolled App Builder store in a spec
- A spec asserting on a return value the production function does not have
- A spec named `*.test.*` (never runs), or an integration spec outside `__tests__/integration/`
- A bug fix touching `frontend/src/` with no spec added, or a spec that never reaches the changed line

# Building this ToolJet app in Code mode

This folder is a ToolJet app project. `frontend/` is one React + TypeScript app (shadcn + Tailwind, react-router)
that ToolJet runs in Code mode. `app.json` names the app and its routes (its screens). ToolJet keeps
sign-in, permissions, environments, data sources and queries; the code calls queries by name.

## Commands

- `tooljet app install`: install dependencies without running any package's install scripts. Use it instead of
  `npm install`; add packages with `npm install --ignore-scripts <name>` (the project's `.npmrc` sets this too).
- `tooljet app pull`: read the app's queries, tables and pages; writes typed hooks to `frontend/src/tooljet.gen.ts`.
  Run it after a query changes in ToolJet.
- `tooljet app check`: fails on any query, route, link or page the code names that the app does not have. Run it
  before you say a change is done.
- `tooljet app dev`: builds on every save and shows the result live in the ToolJet builder (your own preview only).
- `tooljet app publish`: saves the app's draft as a version, as Save version does in the editor. The code is stored on ToolJet and frozen with that version; release and promote it in ToolJet.
- `tooljet app checkout <version>`: work on another ToolJet version; `--list` shows them, `--editing` goes back.
- Git sync: when this folder is the app's `code/` folder in the workspace's git repository, the git branch you are on
  picks that branch's draft (`git checkout feature-x`, then `tooljet app dev`). Commit and pull in ToolJet as usual;
  ToolJet writes `code/` on each commit unless the code is owned by the repository.

## Rules

1. Data comes only from ToolJet queries. Read `frontend/src/tooljet.gen.ts` first and use only the query names,
   parameters and row fields it lists. A query you need but do not see must be created in ToolJet's query editor
   (or by the ToolJet MCP server); then `tooljet app pull`.
   - Read: `const orders = useAppQuery('orders')` gives `{ data, loading, error, run }`; data stays while it reloads.
   - Write: `await update.run({ id, status })`, then `await orders.run()`; show the error message if it throws.
   - No `fetch`, no other network calls, no secrets in the code.
2. Routes: the paths in `app.json` and the `<Route path>`s in the code are the same list. Link with
   `navigate(routePath('order', { id }))`. `ToolJet.useNavigation().routes` says which routes the user may open;
   access per route is set on the route's hidden page (`<home page handle>-<route id>`) in ToolJet.
   A route limit hides the screen; it does not hide its code. Everyone who can open the app downloads every screen's
   code, constants and query names, so nothing secret goes in a screen's code: limit the queries it uses instead.
3. User and environment: `ToolJet.useGlobals()` (`currentUser.name`, `currentUser.groups`, `environment.name`).
4. UI: the kit in `frontend/src/components/ui/*` and Tailwind classes (`bg-primary`, `bg-primary/10`,
   `text-muted-foreground`, `bg-page`). Colours come from the ToolJet theme picked in the app's settings:
   `frontend/styles/theme.css` maps every token to it (`--primary: var(--tj-brand, ...)`), live, dark mode included.
   Keep it that way and write no colours of your own (no hex, no `bg-blue-600`) unless the user asks for a brand or
   palette; then set those tokens in `theme.css` to the colours (`--primary: #0f766e;`). Page-wide rules and library
   overrides go in `frontend/styles/global.css`, which loads last. The page has its own document, so popups and
   dialogs need no portal container.
   The template already stops animations and transitions under `prefers-reduced-motion: reduce`
   (`frontend/src/styles/globals.css`); keep that rule.
   Charts: Recharts through `components/ui/chart` (`<ChartContainer config={...}>` around a Recharts chart, with
   `ChartTooltip` and `ChartTooltipContent`), never drawn by hand. The container animates series by default, turns that
   off under reduced motion and past 300 points, and gives a series with no colour the app's accent, then the theme's
   chart hues; a colour that means something goes in the config through a theme token
   (`overdue: { label: 'Overdue', color: 'var(--destructive)' }`). An app on another UI library, or a user who names
   another chart library, uses that instead.
   Another React UI library (Ant Design, MUI) only when the user asks for one; wire it to the theme with
   `useToolJetTheme()` from `@tooljet/custom-component-sdk` (resolved colours, radius, font, `mode`, plus ready
   `antd` and `mui` objects; it re-renders when the theme changes):
   ```tsx
   import { ConfigProvider, theme } from 'antd';
   import { useToolJetTheme } from '@tooljet/custom-component-sdk';
   const t = useToolJetTheme();
   <ConfigProvider theme={{ token: t.antd, algorithm: t.mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm }}>
   ```
   ```tsx
   import { createTheme, ThemeProvider } from '@mui/material/styles';
   const t = useToolJetTheme();
   const muiTheme = React.useMemo(() => createTheme(t.mui), [t]);
   <ThemeProvider theme={muiTheme}>
   ```
5. Mobile first: write the phone layout, then `sm:` (640), `md:` (768) and `lg:` (1024). Side navigation from
   `lg:`, a top bar below it, a fixed bottom tab bar on phones. Tables become cards below `md:`. Nothing may scroll
   sideways at 375 px. Check every route at 375, 768 and 1280 px wide before you finish.
6. Finish with `tooljet app check` passing and the build clean (`tooljet app dev --once`).

---
id: project-structure
title: Code Mode Project Structure
sidebar_label: Project Structure
---

<div className="badge badge--primary heading-badge">
  <img
    src="/img/badge-icons/premium.svg"
    alt="Icon"
    width="16"
    height="16"
  />
 <span>Paid feature</span>
</div>

A Code mode app is a React and TypeScript project. `app.json` names the app and its screens, and `frontend/` holds the source. ToolJet keeps sign-in, permissions, environments, data sources and queries. This page describes the files in a project, the rules ToolJet applies to them, and what ToolJet stores.

You get a project when you clone an app or create one with the CLI. See [Work Locally](/docs/app-builder/code-mode/local-development).

## Files and Folders

```
orders-desk/
├── app.json                    App name, app ID, code page and screens
├── README.md                   Quick command reference
├── .gitignore
├── .tooljet/                   Written by CLI commands, local to this folder
├── CLAUDE.md, AGENTS.md,       Written by `tooljet skill install`
│   .cursor/rules/tooljet.mdc
└── frontend/
    ├── package.json
    ├── package-lock.json
    ├── .npmrc                  ignore-scripts=true
    ├── tsconfig.json
    ├── postcss.config.cjs
    ├── tailwind.config.cjs
    ├── .tooljet/config.json    The app's component library
    ├── styles/
    │   ├── theme.css           Theme tokens, loaded first
    │   └── global.css          App-wide rules, loaded last
    └── src/
        ├── index.ts            Exports the App component
        ├── App/index.tsx       The screens and the app shell
        ├── lib/router.tsx      Router helpers
        ├── lib/utils.ts        cn() for class names
        ├── styles/globals.css  Tailwind layers and base styles
        ├── components/ui/      UI kit
        └── tooljet.gen.ts      Generated typed hooks: don't edit
```

- `frontend/src/index.ts` must export only React components. ToolJet builds the app from its `App` export.
- The project's `.gitignore` ignores `node_modules/`, `frontend/dist/`, `.tooljet/snapshot.json` and `.tooljet/instance.json`.
- `frontend/package.json` has `lib:*` scripts for custom component libraries. To build and run the app, use the `tooljet app` commands instead.
- ToolJet provides React 18 when the app runs. `react` and `react-dom` aren't bundled.

For the files the CLI writes in `.tooljet/`, see the [CLI reference](/docs/app-builder/code-mode/cli-reference#files-the-cli-writes).

## `app.json`

`app.json` names the app, the ToolJet page that renders the project (the code page), and the app's screens (routes).

```json
{
  "name": "Orders Desk",
  "appId": "55414690-beaa-4fa6-b41b-b8102bd7d1d8",
  "codePage": { "handle": "home", "name": "Home" },
  "routes": [
    { "id": "home", "path": "/", "title": "Orders" },
    { "id": "order", "path": "/orders/:id", "title": "Order" },
    { "id": "admin", "path": "/admin", "title": "Admin" }
  ]
}
```

| <div style={{ width:"150px"}}> Field </div> | <div style={{ width:"100px"}}> Required </div> | <div style={{ width:"400px"}}> Description </div> |
|:---------- | :---------- | :------------ |
| `name` | Yes | The app name. Can't be empty. |
| `appId` | No | The ToolJet app the project belongs to. `clone` and `init --create` set it. `pull`, `dev`, `publish`, `checkout` and `source-pull` need it. |
| `codePage` | Yes | The code page: `handle` (lowercase letters, digits and hyphens, starting with a letter or digit) and `name`. |
| `routes` | Yes | The app's screens. At least one. |
| `routes[].id` | Yes | Starts with a lowercase letter. Lowercase letters, digits, `_` and `-` only. Unique. |
| `routes[].path` | Yes | Starts with `/`. Unique. Use `:name` for a parameter, for example `/orders/:id`. |
| `routes[].title` | No | The screen's title. Shown in menus and in the screen's page name. |
| `version` | No | `{ "id", "name" }` of the version you work on. Set it with `tooljet app checkout`. Local only: ToolJet never stores it. |
| `branch` | No | A workspace git branch to work on instead of the branch the folder's git checkout is on. |

The CLI checks `app.json` every time it reads it, and stops with a message such as `app.json: route id "Orders" must start with a letter and use lowercase letters, digits, _ and -`. The rules:

- `name` is required.
- `codePage.handle` must be lowercase letters, digits and hyphens.
- `routes` must list at least one route.
- Each route ID is listed once, and each path is used by one route.
- Each route path starts with `/`.
- `version` must be an object with `id` and `name`.
- `branch` must be a branch name.

### Screens and Their Hidden Pages

Each route in `app.json` gets a hidden page in the app, named `<code page handle>-<route id>`. For the example above, the `admin` screen's page is `home-admin`. The page's permissions decide who can open the screen. See [Access Control](/docs/app-builder/code-mode/access-control).

`tooljet app dev` and `tooljet app publish` create these pages. `pull` doesn't change them.

Keep the `<Route path>` elements in your code the same as the paths in `app.json`. `tooljet app check` fails when they differ, because permissions are tied to the routes in `app.json`.

:::warning
Limiting a screen hides the screen, not its code. Everyone who can open the app downloads every screen's code, constants and query names. Don't put secrets in a screen's code. To protect data, limit the queries the screen uses.
:::

## `tooljet.gen.ts`

`frontend/src/tooljet.gen.ts` gives your code typed access to the app's queries, routes and pages. `tooljet app pull` and `tooljet app dev` write it from the app. Don't edit it: your changes are overwritten on the next pull. Git sync never commits it.

It exports:

| <div style={{ width:"200px"}}> Export </div> | <div style={{ width:"450px"}}> What It Is </div> |
|:---------- | :---------- |
| `<Table>Row` | One interface per ToolJet Database table that a query uses, with a field per column. For example, table `orders` gives `OrdersRow`. |
| `AppQueries` | Each query's result type and the parameters it declares. |
| `useAppQuery(name)` | Runs a query by name, typed. `run()` accepts only the parameters the query declares. |
| `ROUTES` | Each route's path, by route ID. |
| `routePath(id, params)` | A route's path with its parameters filled in. `routePath('order', { id: 36 })` returns `/orders/36`. |
| `PAGES` | The handles of the app's other visible ToolJet pages, for `goToPage`. |

Query results are typed as follows:

- ToolJet Database **List rows** and **Join tables** queries return `<Table>Row[]`.
- Other ToolJet Database operations return `<Table>Row[] | unknown`.
- Every other query (SQL, REST API and so on) returns `unknown`. Narrow or cast the result in your code.

Column types map to `number`, `boolean` or `string`. JSON columns map to `unknown`. Nullable columns add `| null`.

For how to use these, see [Runtime API](/docs/app-builder/code-mode/runtime-api).

## Styling

The project uses Tailwind CSS with theme tokens defined as CSS variables. The build loads CSS in this order:

1. `frontend/styles/theme.css`
2. The CSS your code imports
3. `frontend/styles/global.css`

### Theme Tokens

`frontend/styles/theme.css` defines the tokens the app uses. By default each token follows the theme picked in the app's settings, and updates live when the theme or dark mode changes:

```css
--primary: var(--tj-brand, #4368e3);
```

ToolJet sets the `--tj-*` variables. The second value is a fallback.

| <div style={{ width:"250px"}}> Tokens </div> | <div style={{ width:"400px"}}> Used For </div> |
|:---------- | :---------- |
| `--page`, `--background`, `--foreground` | Page background, surfaces, text |
| `--card`, `--popover` and their `-foreground` | Cards and popups |
| `--primary`, `--secondary`, `--muted`, `--accent` and their `-foreground` | Brand colour and neutral surfaces |
| `--destructive`, `--success`, `--warning` and their `-foreground` | Status colours |
| `--border`, `--input`, `--ring` | Borders and focus rings |
| `--chart-1` to `--chart-5` | Chart series |
| `--radius`, `--font-sans` | Corner radius and font |

To use your own brand colours instead of the app theme, replace the `var(--tj-...)` with a colour:

```css
--primary: #0f766e;
```

Any CSS colour works. Dark mode fallbacks are under the `.dark` selectors in the same file.

### Tailwind Classes

The Tailwind config maps the tokens to colour utilities: `page`, `background`, `foreground`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `success`, `warning`, `popover`, `card`, `border`, `input`, `ring` and `chart-1` to `chart-5`. For example, `bg-primary`, `text-muted-foreground` and `bg-page`. Opacity modifiers such as `bg-primary/10` work. `rounded-lg`, `rounded-md` and `rounded-sm` follow `--radius`.

Use these classes instead of fixed colours such as `bg-blue-600`, so the app follows the theme and dark mode.

### App-Wide Rules

Put app-wide rules and overrides for a UI library in `frontend/styles/global.css`. It loads last, so its rules win over a library's defaults without `!important`. Tailwind's `@apply` works there.

```css
.ant-btn-primary { border-radius: var(--radius); }
```

### Reduced Motion

`frontend/src/styles/globals.css` stops animations and transitions for users whose system asks for reduced motion (`prefers-reduced-motion: reduce`). Keep that rule.

## UI Kit

`frontend/src/components/ui/` contains components built on Radix UI and Tailwind, in the style of shadcn/ui. They read the theme tokens.

| <div style={{ width:"150px"}}> File </div> | <div style={{ width:"500px"}}> Exports </div> |
|:---------- | :---------- |
| `badge.tsx` | `Badge`, `badgeVariants` |
| `button.tsx` | `Button`, `buttonVariants` |
| `card.tsx` | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` |
| `chart.tsx` | `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, `ChartLegendContent`, `ChartConfig` |
| `input.tsx` | `Input`, `Textarea`, `Label` |
| `select.tsx` | `Select`, `SelectGroup`, `SelectValue`, `SelectTrigger`, `SelectContent`, `SelectItem` |
| `sheet.tsx` | `Sheet`, `SheetTrigger`, `SheetClose`, `SheetContent`, `SheetHeader`, `SheetFooter`, `SheetTitle`, `SheetDescription` |
| `table.tsx` | `Table`, `TableHeader`, `TableBody`, `TableHead`, `TableRow`, `TableCell` |
| `tabs.tsx` | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`, `Switch`, `Tooltip`, `TooltipProvider`, `TooltipTrigger`, `TooltipContent`, `Separator` |

You can edit these files or add your own components.

### Charts

Draw charts with Recharts inside `ChartContainer` from `components/ui/chart`:

```tsx
import { Bar, BarChart, XAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '../components/ui/chart';

const config = {
  total: { label: 'Orders' },
  overdue: { label: 'Overdue', color: 'var(--destructive)' },
} satisfies ChartConfig;

<ChartContainer config={config}>
  <BarChart data={rows}>
    <XAxis dataKey="month" />
    <ChartTooltip content={<ChartTooltipContent />} />
    <Bar dataKey="total" />
    <Bar dataKey="overdue" />
  </BarChart>
</ChartContainer>
```

A series without a colour gets the app's accent, then the theme's chart colours. Give a colour that means something through a theme token, as `overdue` does above. The container animates series, except under reduced motion or past 300 points.

### Other UI Libraries

You can use another React UI library, such as Ant Design or MUI. Connect it to the app theme with `useToolJetTheme()`, which returns ready-made theme objects for both. See [Use the App Theme in Code](/docs/app-builder/code-mode/runtime-api#use-the-app-theme-in-code).

## Dependencies

Code mode installs packages from the npm registry only.

- Every entry in `dependencies`, `devDependencies`, `optionalDependencies`, `peerDependencies`, `resolutions` and `overrides` must be a version, a range or a dist-tag. An `overrides` entry can also point at a dependency's own version with `$<package>`.
- Git, URL, `file:` and `link:` dependencies are refused. So are `npm:` aliases and `workspaces`.
- Every package in the lockfile must resolve from an allowed registry: `registry.npmjs.org`, `registry.yarnpkg.com`, or a registry the ToolJet server allows. A self-hosted admin adds registries with the server's `TOOLJET_CODE_NPM_REGISTRIES` environment variable (comma-separated). See [Environment Variables](/docs/setup/configuration/env-vars#code-mode).
- Package install scripts never run. `tooljet app install` turns them off, and `frontend/.npmrc` sets `ignore-scripts=true`, so a plain `npm install` behaves the same.
- To add a package, run `npm install --ignore-scripts <package>` in `frontend/`.
- `tooljet app publish` needs a lockfile, and installs exactly what it lists.

ToolJet refuses to store a project that breaks these rules, with a message such as `frontend/package.json: ... Code mode installs packages from the npm registry only: no git, URL, file:, link:, alias or workspace dependencies.`

ToolJet stores `frontend/.npmrc` with only `ignore-scripts=true`. It drops every other line, including registry tokens. Keep registry authentication in your user-level `.npmrc`.

To check packages before you add them, run `tooljet app vet`. It checks for malware and known vulnerabilities, versions published in the last 7 days, licences and the blocklist. See [`tooljet app vet`](/docs/app-builder/code-mode/cli-reference#tooljet-app-vet).

## What ToolJet Stores

When the CLI or the editor saves the app's code, ToolJet stores only the project's text source files:

- `app.json` and `README.md`
- `frontend/package.json`, `frontend/package-lock.json`, `frontend/tsconfig.json`, `frontend/.npmrc` and `frontend/.tooljet/config.json`
- `frontend/tailwind.config.*` and `frontend/postcss.config.*` (`.js`, `.cjs`, `.mjs` or `.ts`)
- Files under `frontend/src/` and `frontend/styles/` with these extensions: `ts`, `tsx`, `js`, `jsx`, `mjs`, `cjs`, `css`, `json`, `md`, `svg`, `txt`

ToolJet doesn't store:

- Binary files, such as PNG images or fonts. Use SVG, or load them from an address your workspace allows. See [Allow Outside Addresses](/docs/app-builder/code-mode/security#allow-outside-addresses).
- Dot files and folders inside `frontend/src/` and `frontend/styles/`, and `node_modules`.
- The `version` field in `app.json`.
- Lockfiles other than `package-lock.json`. <!-- TODO verify: pnpm-lock.yaml and yarn.lock are not on the stored-file allowlist, so pnpm and yarn projects appear to lose their lockfile on ToolJet and in git sync; confirm before documenting -->

The source sync never follows a symlink that leads outside the project.

### Limits

| <div style={{ width:"250px"}}> Limit </div> | <div style={{ width:"150px"}}> Value </div> |
|:---------- | :---------- |
| Size of one file | 512 KB |
| Size of the lockfile | 4 MB |
| Size of the whole project | 12 MB |
| Number of files | 1000 |
| Length of a file path | 512 characters |

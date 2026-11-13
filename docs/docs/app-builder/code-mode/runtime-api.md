---
id: runtime-api
title: Code Mode Runtime API
sidebar_label: Runtime API
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

:::caution BETA
Code mode is in beta and not recommended for production use.
:::

A Code mode app's code talks to ToolJet through the `ToolJet` object and a few hooks. With them, the code runs the app's queries, reads the signed-in user and environment, moves between screens, and follows the app theme. This page lists each one.

## Imports

```tsx
import { ToolJet, useToolJetTheme } from '@tooljet/custom-component-sdk';
import { useAppQuery, routePath, ROUTES, PAGES } from '../tooljet.gen';
import { AppRouter, useUnsavedChanges, useAllowedRoutes } from '../lib/router';
```

The paths above are relative to `frontend/src/App/`. `tooljet.gen.ts` is generated from the app by `tooljet app pull`. `lib/router.tsx` is part of the project template. See [Project Structure](/docs/app-builder/code-mode/project-structure).

The hooks work in any component or custom hook inside the app, not only in the root `App` component.

## Run Queries

You create and edit queries in ToolJet's query editor. The code runs them by name.

```tsx
const orders = useAppQuery('orders');
```

`useAppQuery(name)` comes from `tooljet.gen.ts` and is typed: `data` has the query's row type, and `run()` accepts only the parameters the query declares. It is `ToolJet.useQuery(name)` with types. To pass options, use `ToolJet.useQuery` directly:

```tsx
const order = ToolJet.useQuery('orderById', { enabled: !!orderId });
```

Both return:

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"500px"}}> Description </div> |
|:---------- | :---------- |
| `data` | The last finished result. It stays while the query runs again, so the screen doesn't flash empty. |
| `loading` | `true` while a run is in progress. |
| `error` | A `QueryError` when the last run failed, else `null`. It is `null` while the query runs. |
| `run(params?)` | Runs the query. Returns a promise that resolves with the result data, or rejects with a `QueryError`. |

### Options

| <div style={{ width:"150px"}}> Option </div> | <div style={{ width:"100px"}}> Default </div> | <div style={{ width:"400px"}}> Description </div> |
|:---------- | :---------- | :------------ |
| `enabled` | `true` | When `false`, the query doesn't run at all, on its own or from `run()`, until it is `true`. `run()` then returns the current data without a request. Use it until the screen has what the query needs, such as a record's ID. |

### Parameters

Declare parameters in the query editor, and read them in the query as `{{parameters.<name>}}`. Pass values with `run()`:

```tsx
await updateStatus.run({ id: order.id, status: 'shipped' });
```

- A parameter you don't pass uses the default set in the query.
- ToolJet drops values for parameters the query doesn't declare. With `useAppQuery`, passing an undeclared parameter is a TypeScript error. Declare the parameter in the query and read it there.
- Don't cast `useAppQuery`, its `run`, or the values you pass to `run`. A cast hides undeclared parameters, and `tooljet app check` fails on it. To type the rows, cast what `run()` returns, or `data`.

### Errors

A failed run rejects with a `QueryError`:

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"500px"}}> Description </div> |
|:---------- | :---------- |
| `name` | `"QueryError"` |
| `message` | `Query "<name>" failed`, followed by the data source's message when there is one. |
| `query` | The query name. |
| `result` | The raw result of the failed run. |

Running a name the app doesn't have fails with `No query named "<name>" in this app`. Run `tooljet app check` to catch these before you publish.

### Write, Then Refresh

To change data, run the write query, then run the read query again. Show the error if the write fails:

```tsx
import { useState } from 'react';
import { Button } from '../components/ui/button';
import { useAppQuery } from '../tooljet.gen';

export function ShipButton({ id }: { id: number }) {
  const orders = useAppQuery('orders');
  const updateStatus = useAppQuery('updateOrderStatus');
  const [error, setError] = useState<string | null>(null);

  const ship = async () => {
    setError(null);
    try {
      await updateStatus.run({ id, status: 'shipped' });
      await orders.run();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <>
      <Button onClick={ship} disabled={updateStatus.loading}>Mark as shipped</Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </>
  );
}
```

### Queries That Run on Page Load

In a Code mode app, a query set to run on page load runs when a screen that reads it opens. A query that no open screen reads never runs. For such a query, `loading` is `true` until its first result, for up to 15 seconds.

When a screen opens after the app changed data, ToolJet runs its page-load queries again so they aren't stale. Once the app runs a query itself, its hook shows only the app's own newest run.

### Required Parameters

For a query that reads data (a ToolJet Database **List rows** or **Join tables** query, or SQL that starts with `SELECT` or `WITH`), a parameter matched for equality, such as `id eq {{parameters.id}}`, is required. A run that leaves it empty is skipped: it returns the current data and logs a warning in the browser console. Pass the value to `run()`, or use `enabled: false` until the screen has it.

### Queries Running in a Loop

If the code runs the same query with the same parameters more than 5 times a second for 2 seconds, ToolJet slows it to one run a second. It stays slowed until no call comes for 2 seconds. Calls that arrive meanwhile share that run. Runs with different parameters are counted apart, so typing in a search box isn't slowed.

In the editor, the canvas shows a notice that names the query, and the Debugger logs `[Code mode] Query running in a loop`. This usually means an effect re-runs the query on its own result. A released app is only slowed, with no notice.

## Read the User and Environment

`ToolJet.useGlobals()` returns:

```ts
{
  currentUser: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    name: string;            // first and last name, else the email
    signedIn: boolean;       // false for visitors to a public app
    groups: readonly string[];
  };
  environment: { id: string; name: string };
  mode: 'edit' | 'view';
  theme: { mode: 'light' | 'dark' };
  app: { id: string; name: string; slug: string };
}
```

```tsx
const { currentUser, environment } = ToolJet.useGlobals();
const isManager = currentUser.groups.includes('Managers');
```

Use these values only to show or hide parts of a screen. They don't protect data: screen and query permissions do. See [Access Control](/docs/app-builder/code-mode/access-control).

## Move Between Screens

### `ToolJet.useNavigation()`

Returns the app's screens and functions to move between them:

| <div style={{ width:"200px"}}> Property </div> | <div style={{ width:"450px"}}> Description </div> |
|:---------- | :---------- |
| `path` | The current screen's path. Never a screen the user can't open. |
| `accessDenied` | `true` when the user can open no screen at all. |
| `routes` | Every route in `app.json`: `{ id, path, title, allowed }`. `allowed` is `false` for screens the user can't open. |
| `match(path)` | The route a path matches, with its `params`, or `null`. |
| `navigate(to, { replace })` | Opens a screen by path. Returns `false` when the user can't open it. |
| `back()` | Goes back in the browser history. |
| `pages` | The app's other visible ToolJet pages: `{ handle, name }`. Excludes page groups and disabled or restricted pages. |
| `goToPage(handle, params)` | Opens another ToolJet page of the app. |
| `setLeaveWarning(message)` | Sets the question to ask before the user leaves unsaved work, or `null` to clear it. Up to 500 characters. |

How it behaves:

- The current screen is kept in the app's URL as `?route=`, for example `?route=/orders/36`. A shared link opens the same screen, and the browser's back button works. The first screen (`/`) has no `route` parameter.
- A link to a screen the user can't open shows a "no access" message in place of the screen's content. `navigate()` to such a screen also shows it, and returns `false`.
- A link to a path that matches no route opens the first screen the user can open.
- In the editor, every screen is allowed.
- While a leave warning is set, ToolJet asks before a reload, closing the tab, the browser's back and forward buttons (in browsers that support it), and `goToPage`.

### Route Helpers

`tooljet.gen.ts` exports the routes from `app.json`:

- `ROUTES`: each route's path by ID, for example `ROUTES.order` is `'/orders/:id'`.
- `routePath(id, params)`: the path with its parameters filled in and encoded. `routePath('order', { id: 36 })` returns `'/orders/36'`.
- `PAGES`: the handles of the app's other ToolJet pages, for `goToPage`.

Link with `routePath` rather than typed paths, so `tooljet app check` can catch a route ID that doesn't exist:

```tsx
navigate(routePath('order', { id: order.id }));
```

### Router Helpers

`frontend/src/lib/router.tsx` connects React Router to ToolJet:

| <div style={{ width:"250px"}}> Helper </div> | <div style={{ width:"400px"}}> Description </div> |
|:---------- | :---------- |
| `<AppRouter>` | Wraps the app in a router that keeps the screen in ToolJet's URL and enforces screen permissions. When the user can open no screen, it shows "You do not have access to this part of the app." |
| `useUnsavedChanges(dirty, message)` | While `dirty` is `true`, links and `navigate()` ask `message` before leaving the screen, and ToolJet asks before the back button, a reload or closing the tab. |
| `confirmLeave(message?)` | Asks before closing something with unsaved work, such as a dialog. Returns `true` when there is nothing unsaved or the user agrees. |
| `useAllowedRoutes()` | The routes the user can open, for building menus. |

```tsx
import { NavLink, Route, Routes } from 'react-router';
import { AppRouter, useAllowedRoutes } from '../lib/router';

function Nav() {
  const routes = useAllowedRoutes().filter((r) => !r.path.includes(':'));
  return (
    <nav>
      {routes.map((r) => (
        <NavLink key={r.id} to={r.path} end>{r.title ?? r.id}</NavLink>
      ))}
    </nav>
  );
}

export const App = () => (
  <AppRouter>
    <Nav />
    <Routes>
      <Route path="/" element={<Orders />} />
      <Route path="/orders/:id" element={<OrderDetail />} />
    </Routes>
  </AppRouter>
);
```

Every `<Route path>` must match a path in `app.json`.

## List Workspace Users

`ToolJet.useWorkspaceUsers(options?)` lists the active workspace users who can open the app, for fields such as an assignee or an owner. ToolJet returns only people with access to the app, and only to a user who can open it.

```tsx
const [search, setSearch] = useState('');
const users = ToolJet.useWorkspaceUsers({ search, limit: 20 });
```

| <div style={{ width:"150px"}}> Option </div> | <div style={{ width:"500px"}}> Description </div> |
|:---------- | :---------- |
| `search` | Filters the list. Changes wait 250 ms before a request. |
| `limit`, `offset` | Pages through the list. |

Returns:

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"500px"}}> Description </div> |
|:---------- | :---------- |
| `data` | The users: `{ id, email, firstName, lastName, name, avatarUrl, groups }`. |
| `isLoading` | `true` while the list loads. |
| `error` | An error when the list couldn't load, else `null`. |
| `hasMore` | `true` when there are more users after this page. |
| `refetch()` | Loads the list again. Pages are otherwise cached for 30 seconds. |

Store a user's `id` (and `email` if a query needs it), and show their `name`.

## Use the App Theme in Code

`useToolJetTheme()` returns the app theme as values, and re-renders when the theme or dark mode changes. Use it to connect another UI library to the theme. For Tailwind and CSS, use the theme tokens instead. See [Styling](/docs/app-builder/code-mode/project-structure#styling).

| <div style={{ width:"150px"}}> Property </div> | <div style={{ width:"500px"}}> Description </div> |
|:---------- | :---------- |
| `mode` | `'light'` or `'dark'` |
| `colors` | `brand`, `brandStrong`, `onBrand`, `page`, `surface`, `surfaceAlt`, `surfaceMuted`, `text`, `textMuted`, `border`, `borderWeak`, `danger`, `success`, `warning` |
| `radius` | `default`, `small`, `large`, in pixels |
| `fontFamily` | The app font |
| `antd` | Theme tokens for Ant Design's `ConfigProvider` |
| `mui` | Theme options for MUI's `createTheme` |

Ant Design:

```tsx
import { ConfigProvider, theme } from 'antd';
import { useToolJetTheme } from '@tooljet/custom-component-sdk';

export function ThemedAntd({ children }: { children: React.ReactNode }) {
  const t = useToolJetTheme();
  return (
    <ConfigProvider
      theme={{ token: t.antd, algorithm: t.mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm }}
    >
      {children}
    </ConfigProvider>
  );
}
```

MUI:

```tsx
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useToolJetTheme } from '@tooljet/custom-component-sdk';

export function ThemedMui({ children }: { children: React.ReactNode }) {
  const t = useToolJetTheme();
  const muiTheme = React.useMemo(() => createTheme(t.mui), [t]);
  return <ThemeProvider theme={muiTheme}>{children}</ThemeProvider>;
}
```

Put library overrides in `frontend/styles/global.css`, which loads after the library's CSS.

## Custom Component Hooks

The `ToolJet` object also has the hooks custom components use on visual pages, such as `useStateString`, `useStyleString`, `useEventCallback` and `useAction`. A Code mode app doesn't need them. See [Build Components](/docs/app-builder/custom-component-library/build-components).

## What App Code Can't Do

### Call Other Addresses

App code can't call `fetch` or make other network requests to outside addresses. By default it reaches only your ToolJet instance, so all data goes through queries. Queries run on the ToolJet server with the data source's credentials, so keep secrets in data sources, never in the code.

A workspace admin can allow more addresses for apps to connect to, load images or fonts from, and so on. See [Allow Outside Addresses](/docs/app-builder/code-mode/security#allow-outside-addresses).

### Run JavaScript on the ToolJet Page

ToolJet runs a Code mode app in an isolated frame, apart from the ToolJet page. See [Isolation](/docs/app-builder/code-mode/security#isolation). By default it also applies strict mode to the app, which limits what the app's visual parts can run on the ToolJet page:

- **RunJS and RunPy queries, and queries with a transformation**, are refused with `Code mode apps can't run JavaScript or Python on the page. Move this logic into the app's code.` Do that work in the app's code instead.
- **`{{ }}` bindings** are evaluated with a limited interpreter. Only known values and a fixed set of methods are allowed. Anything else fails with a message that ends `isn't allowed in a Code mode app's bindings. Move this logic into the app's code.`
- **App JavaScript libraries and preloaded scripts** don't load.
- **The legacy Custom component widget** is refused.
- **The IFrame component** loads only `http://`, `https://` or relative addresses. Other addresses load a blank page.
- **The Open webpage action** opens only `http://`, `https://` or same-site paths.
- **The Set local storage action** does nothing.

On self-hosted ToolJet, an admin can change isolation and strict mode with the `CODE_MODE_ISOLATION` and `CODE_MODE_STRICT_BINDINGS` environment variables. See [Environment Variables](/docs/setup/configuration/env-vars#code-mode).

---
id: cli-reference
title: CLI Reference and Limits
sidebar_label: CLI Reference
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
Custom Component Libraries are currently in beta and not recommended for production use.
:::

This page lists the ToolJet CLI commands, flags, limits, naming rules and project settings for Custom Component Libraries.

## Commands

| <div style={{ width:"250px"}}> Command </div> | <div style={{ width:"120px"}}> Run From </div> | <div style={{ width:"300px"}}> What It Does </div> |
|:---------- | :---------- | :------------ |
| `tooljet login` | Anywhere | Asks for the ToolJet origin URL and a personal access token. |
| `tooljet auth login --url <origin>` | Anywhere | Signs in through the browser, with no token to paste. |
| `tooljet library init <dir>` | Anywhere | Registers a library in the workspace and creates the project. |
| `tooljet library build` | Library directory | Builds to `dist/`. No sign-in needed and nothing is uploaded. |
| `tooljet library typecheck` | Library directory | Type-checks the code and parses its stylesheets without building. Nothing is uploaded. |
| `tooljet library dev` | Library directory | Watches `src/` and uploads to the developer's dev track on every save. |
| `tooljet library publish -v <version>` | Library directory | Builds and publishes a new version. |

`lib` is an alias for `library` in all five library commands.

`tooljet library build` exits with code `1` on TypeScript errors, and `tooljet library typecheck` exits with code `1` when it finds a problem, so either works as a CI check.

## Flags

| <div style={{ width:"200px"}}> Flag </div> | <div style={{ width:"150px"}}> Commands </div> | <div style={{ width:"300px"}}> Purpose </div> |
|:---------- | :---------- | :------------ |
| `--display-name` | `init` | The library's display name. Skips the prompt. |
| `--local` | `init` | Creates the project only: no sign-in, and no library is registered in a workspace. `dev` or `publish` registers it later, after a confirmation prompt. |
| `--template` | `init` | `new`, the default, creates a custom component library. `code-app` creates a whole React app on shadcn/ui, Tailwind and React Router. To work on a React Builder app, see [Build Locally](../react-builder/local-development.md) instead. |
| `--env` | `build` | `production`, the default, or `development`. |
| `--json` | `typecheck` | Prints the result as JSON. |
| `--url` and `--token` | `dev`, `publish` | Target a workspace directly instead of using the stored login. Use both together. |
| `--debounce` | `dev` | Milliseconds to wait after a save before rebuilding. Defaults to `300`. |
| `--version`, `-v` | `publish` | Required. The version to publish. |
| `--message`, `-m` | `publish` | Optional. A message describing the version. |
| `--skip-type-check` | `publish` | Publish even if there are TypeScript errors. |

## Limits

| <div style={{ width:"200px"}}> Limit </div> | <div style={{ width:"150px"}}> Value </div> |
|:---------- | :---------- |
| Published bundle | 10 MB |
| Dev bundle | 30 MB |
| CSS | 5 MB |
| Manifest | 1 MB |
| Library display name | 100 characters |

## Naming Rules

| <div style={{ width:"200px"}}> Field </div> | <div style={{ width:"400px"}}> Rule </div> |
|:---------- | :---------- |
| Directory name (`init` argument) | Starts with a letter. Letters, numbers, hyphens and underscores only. |
| Library display name | Starts with a letter. Letters, numbers, spaces, hyphens and underscores only. Up to 100 characters. |
| Version (`--version`) | `X`, `X.Y` or `X.Y.Z`, with no leading zeros. Must be unique within the library. |
| Property, action and style names | `isVisible`, `isLoading`, `setVisibility`, `setLoading` and the style name `boxShadow` are reserved. ToolJet also sets `isDisabled` and `setDisable` on every component, so avoid them too. |

## Project Settings

`tooljet library init` writes `.tooljet/config.json` in the project.

| <div style={{ width:"200px"}}> Key </div> | <div style={{ width:"400px"}}> Purpose </div> |
|:---------- | :---------- |
| `libraryName` | The library's display name. Written by `init`. |
| `correlationId` | Links the project to the library in ToolJet. Written by `init`. Don't change or delete it. |
| `recordRender` | Optional, off by default. Set it to `true` to render each component during the build, which lets the build read hooks that a component calls from helper functions. |

## Runtime Notes

- Components render inline in the app page, inside a shadow root, and share the app's copy of React. They don't run in a separate frame, so a component's code has the same access to the page as the app itself.
- ToolJet provides React 18 at runtime. `react`, `react-dom` and `react/jsx-runtime` are left out of the bundle, which keeps component bundles small. Every other import must be bundled. A bundle that still imports another package fails with `the code imports "<name>", which ToolJet does not provide`.
- CSS imported by a component is collected into `dist/index.css` and loaded automatically. It is applied inside the component's shadow root: ToolJet's global CSS doesn't reach in, and the app's theme variables and font do.
- A library's code is loaded once for each library version, however many of its components are on the page.
- A component that sets no default size is dropped 6 columns wide and 5 rows high. Content that overflows the component's box is clipped.
- If a component's code can't be loaded, ToolJet retries and then shows "This component couldn't load." with a **Retry** button.

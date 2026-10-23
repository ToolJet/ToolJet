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

This page lists the ToolJet CLI commands, flags, limits and naming rules for Custom Component Libraries.

## Commands

| <div style={{ width:"250px"}}> Command </div> | <div style={{ width:"120px"}}> Run From </div> | <div style={{ width:"300px"}}> What It Does </div> |
|:---------- | :---------- | :------------ |
| `tooljet login` | Anywhere | Asks for your ToolJet origin URL and personal access token. |
| `tooljet library init <dir>` | Anywhere | Registers a library in the workspace and creates the project. |
| `tooljet library build` | Library directory | Builds to `dist/`. No sign-in needed and nothing is uploaded. |
| `tooljet library dev` | Library directory | Watches `src/` and uploads to your dev track on every save. |
| `tooljet library publish -v <version>` | Library directory | Builds and publishes a new version. |

`lib` is an alias for `library` in all four library commands.

## Flags

| <div style={{ width:"200px"}}> Flag </div> | <div style={{ width:"150px"}}> Commands </div> | <div style={{ width:"300px"}}> Purpose </div> |
|:---------- | :---------- | :------------ |
| `--url` and `--token` | `dev`, `publish` | Target a workspace directly instead of using the stored login. Use both together. |
| `--debounce` | `dev` | Milliseconds to wait after a save before rebuilding. Defaults to `300`. |
| `--version`, `-v` | `publish` | Required. The version to publish. |
| `--message` | `publish` | Optional. A message describing the version. |
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

## Runtime Notes

- ToolJet provides React 18 at runtime. `react`, `react-dom` and `react/jsx-runtime` are left out of the bundle, which keeps component bundles small.
- CSS imported by a component is collected into `dist/index.css` and loaded automatically.

---
id: preview-and-publish
title: Preview and Publish a Library
sidebar_label: Preview and Publish
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

While you build, use dev mode to see your components in the App Builder as you save. When they're ready, publish a version that app builders can pin in their apps.

## Preview Changes with Dev Mode

Run this from inside the library directory:

```bash
tooljet library dev
```

The CLI watches `src/`, rebuilds on every save, and uploads the result to your **dev track**. A dev track is a private slot, one per developer per library. After each save, the CLI prints the build time, any TypeScript errors, and whether the upload succeeded.

To see your dev build in the App Builder:

1. Open the **Custom** tab in the component library.
2. Open the library's version picker.
3. Select the **Dev preview** entry. It is labelled with your email and marked **preview only**.

Keep these points in mind:

- **Dev builds never reach end users.** Previewed and released apps always render the published version.
- **Each developer gets their own dev build.** Two developers working on the same library don't overwrite each other's previews.
- **Empty builds aren't uploaded.** If the build finds no components in `src/index.ts`, the CLI skips the upload and tells you.

### Flags

| <div style={{ width:"150px"}}> Flag </div> | <div style={{ width:"100px"}}> Default </div> | <div style={{ width:"350px"}}> Purpose </div> |
|:---------- | :---------- | :------------ |
| `--debounce` | `300` | Milliseconds to wait after a save before rebuilding. |
| `--url` and `--token` | — | Target a workspace directly instead of using the stored login. Use both together. |

:::info
**Hot reload not working?** Ad blockers and some browser extensions can block the live connection that dev preview uses. If your saved changes stop appearing in the App Builder, disable them and try again.
:::

## Build Locally (Optional)

```bash
tooljet library build
```

This builds the library to `dist/` without uploading anything. It doesn't need you to be signed in, so it works well as a CI check.

## Publish a Version

```bash
tooljet library publish --version 1.0.0 --message "Add dark mode support"
```

- `--version` is required. It accepts `X`, `X.Y` or `X.Y.Z`. Missing parts default to zero, so `1` becomes `1.0.0`. Leading zeros are not allowed.
- `--message` is optional.

The command builds the library, generates the manifest, type-checks the code, and uploads it. As it runs, it prints the number of components, the bundle size and the CSS size.

### Publishing Rules

- **Versions can't be changed.** Once a version is published, its code never changes. Publishing a version number that already exists fails with "Version already exists for this library — choose a different version."
- **Publishing never changes running apps.** Each app pins a version. A new version is only offered as an upgrade. See [Versions and Pinning](/docs/app-builder/custom-component-library/use-in-app-builder#versions-and-pinning).
- **TypeScript errors block the publish.** Use `--skip-type-check` to publish anyway.
- **A library needs at least one component.** If nothing exported from `src/index.ts` is a React component, the publish stops.

### Publish from CI

`--url` and `--token` work the same way as in dev mode. Use them to publish from a CI pipeline without a stored login:

```bash
tooljet library publish --version 1.2.0 --url https://app.tooljet.ai --token <your-token>
```

## Next Steps

Your library is now available in the **Custom** tab. See [Use Custom Components in the App Builder](/docs/app-builder/custom-component-library/use-in-app-builder).

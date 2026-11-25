# Dependency patches

Small edits to packages in `node_modules`, applied with [patch-package](https://github.com/ds300/patch-package). `scripts/apply-patches.js` applies them; `rspack.config.js`, `webpack.config.js` (also used by Storybook) and `jest.config.js` call it, so every build and test run gets them. It is not an npm `postinstall` on purpose: the Dockerfiles install before copying this folder.

## `moment+2.31.0.patch`

moment 2.31.0 fixes CVE-2026-17495 but also changes results that user apps can depend on, because `moment` is available in `{{ }}` and RunJS. The patch restores the 2.30.1 results and keeps the security fix.

| Restored | 2.30.1 (and patched) | Unpatched 2.31.0 |
| --- | --- | --- |
| Offsets outside -12:00..+14:00 (two hunks) | Accepted | Date is invalid; `utcOffset()` ignores them |
| `moment.min` / `moment.max` with a non-moment | Throws | Skips it |
| `format('constructor')` and other `Object.prototype` names | Runs the inherited method | Formats the letters as tokens |
| Weekday plus a partial date, e.g. `('Wednesday 27', 'dddd D')` | Invalid when the weekday does not match | Weekday ignored |
| Parsing `eHHmm`, e.g. `('31030', 'eHHmm')` | Separate tokens, so invalid | New single token, so valid |

`src/_helpers/__tests__/momentCompat.spec.js` checks each row.

Server, plugins and marketplace have their own moment and are not patched.

## Upgrading moment

`moment` is pinned exactly because the patch only fits one version. A bump (including Dependabot's) fails the build with "Could not apply frontend/patches" until you do this:

1. Read moment's changelog for the new version and decide which rows above still need restoring.
2. Set the exact version: `npm install moment@<version> --save-exact`, then `npm ci` to get a clean copy.
3. Try the old edits on it. Make them in `node_modules/moment/moment.js` (the file the bundlers load), then run `npx patch-package moment`. Delete the old patch file.
4. Update `PATCH_FILES` in `scripts/apply-patches.js` and the version in `momentCompat.spec.js`.
5. Run `npx jest momentCompat` plus the date, calendar, table and timeline suites, and compare old and new output for anything the changelog mentions.
6. Check that the new version's security fixes are not touched by the patch.

To drop the patch: delete it and its `PATCH_FILES` entry, change the spec to the new values, and put the behavior change in the release notes. With no patches left, also remove `apply-patches.js`, its three callers and `patch-package`.

"Could not apply" right after pulling a changed patch means `node_modules` still has the old edits: run `npm ci`.

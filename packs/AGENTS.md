# Component packs

`builtin.json` lists the packs built and shipped by `build-builtin.mjs`.
Entries in `disabled` skip both the build and dependency installation, even
when the script runs with `--install`.

## Frontend CI dependencies

Disabling a pack for release does not disable its frontend Jest tests.
Specs under `frontend/src/AppBuilder/Widgets/LibraryComponent/__tests__/`
import pack source directly. Shared helpers also import MUI for tests of
other packs, so MUI dependencies must remain available in CI. Some specs
also read `packs/mui/dist/manifest.json`, which requires a local pack build.

While MUI is disabled, `.github/workflows/ci.yml` installs its dependencies
and builds it separately in the **Prepare MUI pack for tests** step. The
build writes to `packs/mui/dist` only; it does not copy MUI to
`server/builtin-packs`, so the pack remains excluded from release packaging.

When re-enabling MUI in `builtin.json`, remove that extra CI preparation
step and its comments in the same change: **Build component packs** already
installs and builds enabled packs with `--install`. Run the frontend test suite to
verify that pack dependencies still resolve. If another pack is disabled,
check its direct tests and shared helpers before removing its CI dependencies.

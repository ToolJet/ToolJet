/**
 * Kill switches for the data and rendering engines. The server's DISABLE_BACKGROUND_DATA env var (public config) lists
 * the parts to turn off, comma-separated; each falls back to how the App Builder worked before it:
 * - `propagation`: dependents of a change resolve in one go instead of in slices
 * - `transport`: query responses are parsed on the main thread instead of in a worker
 * - `expressions`: `{{ }}` templates are read and compiled on every resolution instead of once
 * - `memory`: nothing is refused for lack of memory (the tab may crash instead)
 * - `user-copies`: scripts get a full copy of the queries, `page` and `variables` on every run
 * - `sliced-checks`: a script's result is checked for cycles in one go
 * - `listview-store`: ListView child properties resolve once per row even when no row is involved
 */
const disabled = () =>
  String(globalThis.window?.public_config?.DISABLE_BACKGROUND_DATA ?? '')
    .split(',')
    .map((name) => name.trim());

export const isFeatureEnabled = (name) => !disabled().includes(name);

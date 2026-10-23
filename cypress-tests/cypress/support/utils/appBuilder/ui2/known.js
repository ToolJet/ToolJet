// Failures the team already tracks. A test listed here still runs and still fails (its title and message carry the
// reason), so a fix shows up as a pass; set CYPRESS_ui2_skip_known=true to skip them for a baseline run. Remove an
// entry when its fix lands.
//
// Shape: { <check>: { <widget type or part case name>: reason | { reason, when: (ctx) => boolean } } }, where check is
// one of grid, geometry, parity, themeParity, parts, loadingHeight, and ctx is { mode, width, theme }. Example:
//   geometry: { ShadSpinner: { reason: "TJ-1234 spinner overflows at 20px", when: (c) => c.mode === "viewer" } },
//
// Empty since 29551480b5: the off-grid default heights (36 widgets at a839e007ee) were fixed by b61ce368e1.
const KNOWN = {};

/** The reason a check is known to fail for a widget, or null. */
export const knownFailure = (check, type, ctx = {}) => {
  const entry = KNOWN[check]?.[type];
  if (!entry) return null;
  if (typeof entry === "string") return entry;
  return entry.when(ctx) ? entry.reason : null;
};

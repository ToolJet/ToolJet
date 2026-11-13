# Inspector input controls

`Switch.jsx` is the shared segmented selector used by native widget configs and pack
manifest fields. It measures rendered option labels and asks the editor bridge for a
full-width row when equal cells cannot fit the widest label plus padding in 142px.
The decision is independent of the current selection. ResizeObserver and font readiness
refresh measurement; disconnect observers on unmount.

`Switch.scss` keeps cell widths and padding identical in both states. Labels use
ellipsis when the full row still cannot fit them, with native `title` text for hover.
Keep styling scoped to `.inspector-segmented-control`; other ToggleGroup uses retain
their existing presentation. The bridge in `CodeEditor/SingleLineCodeEditor.jsx` owns
placement, while explicit `newLine` metadata and expression mode retain precedence.

`__tests__/Switch.spec.jsx` checks layout requests with browser text geometry supplied
at the DOM boundary. Actual wrapping, clipping, and selection geometry require a browser.

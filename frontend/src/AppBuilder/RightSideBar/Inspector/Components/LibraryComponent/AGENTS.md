# Library component inspector

`index.tsx` renders manifest properties and styles through the shared inspector renderer;
`utils.ts` maps manifest fields to inspector metadata.

Compact manifest style fields use `styles.scss`: a wrapping label, a reserved 24px fx column, and a consistent 142px
control column. Never absolutely position fx over the label or control. Do not infer `newLine` from label character count. Explicit stacked fields
and active expression editors retain the shared renderer's layout. Keep these rules scoped
to `.library-style-field` so native and custom inspectors are unaffected. Controls render
`.row.fx-container` with either `> .col` (toggle, colour) or `> .field` directly (dropdown); reset the row's 8px
gutter padding for both, and let fixed-width controls (the 144px dropdown) fill the column.
Switch (boolean) rows stay out of the grid: a switch is content-width and would sit at the left of the
column, so they keep the shared flex layout with the switch at the right edge, as on the Properties tab.

Editor metadata and list editing tests live in `__tests__/`. Verify actual label/control
geometry in the browser; Jest does not compute CSS layout.

A pack instance's Properties tab opens with `PackIdentityStrip` (design option D): one shared Lucide `Library` icon,
the library name, a `·`, and the component name, built by `packIdentity()`. A custom library's instance gets the same
strip from `libraryIdentity()`: the library's current name from the libraries store (matched by correlationId), else
the `libraryName` saved on the instance at drop. Its Revision row sits directly below the strip without a title or accordion.
When the names don't fit, the library name is cut first and the component name stays whole; the library keeps
at least min(its full name, 40%), so a cut component name never takes more than 60% while the library is cut.
This is CSS only (styles.scss): two hidden attr(data-name) copies size the library name, so keep its data-name equal
to the name. A cut-off name shows in full in the Inspector's own tooltip (no native title).
Native widgets (ToolJet UI 1.0 · display name) and module instances (Modules · module name, with the Lucide
`Blocks` icon) get the same strip from `Inspector.jsx`, via `componentIdentity()` in the Inspector folder.

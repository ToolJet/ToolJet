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

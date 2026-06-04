// Shared "Tooltip" field pair for widgets whose tooltip lives in the inspector's
// General section (vs Additional Actions). Mirrors the additionalActions pair
// used by widgets like Button — same UX, different section. 
//
// MAINTENANCE NOTE — universal-tooltip override
// ---------------------------------------------
// Each consuming widget spreads `GENERAL_TOOLTIP_FIELDS` into its own `general:`
// block, which OVERRIDES the universal `general.tooltip` config in
// `server/src/modules/apps/services/widget-config/index.js`
// (combineProperties does `{ ...universal.general, ...widget.general }`, widget
// wins). The override is intentional — we need `showLabel: false` on the tooltip
// code input so the new `tooltipFormat` switch above it provides the single
// visible "Tooltip" label.
//
// Implication: future changes to the universal `general.tooltip` (e.g., new
// validation rules, default values, type changes) will NOT reach the 16
// general-section widgets unless mirrored here in `GENERAL_TOOLTIP_FIELDS`.
// If you touch the universal tooltip definition, check that this file stays
// compatible. Frontend mirror lives at
// `frontend/src/AppBuilder/WidgetManager/widgets/_sharedGeneralTooltip.js` —
// keep both in sync.
export const GENERAL_TOOLTIP_FIELDS = {
  tooltipFormat: {
    type: 'switch',
    displayName: 'Tooltip',
    options: [
      { displayName: 'Plain text', value: 'plainText' },
      { displayName: 'Markdown', value: 'markdown' },
      { displayName: 'HTML', value: 'html' },
    ],
    isFxNotRequired: true,
    defaultValue: { value: 'plainText' },
    fullWidth: true,
    newLine: true,
  },
  tooltip: {
    type: 'code',
    displayName: 'Tooltip',
    validation: { schema: { type: 'string' } },
    placeholder: 'Enter tooltip text',
    showLabel: false,
  },
};

export const GENERAL_TOOLTIP_DEFAULTS = {
  tooltipFormat: { value: 'plainText' },
  tooltip: { value: '' },
};

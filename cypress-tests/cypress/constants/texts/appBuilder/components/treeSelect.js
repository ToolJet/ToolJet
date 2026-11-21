// Texts for the Tree Select widget. Config: packages/widget-definitions/src/widgets/treeSelect.js
// Runtime: frontend/src/AppBuilder/Widgets/TreeSelect/TreeSelect.jsx + TreeSelectCheckbox.jsx + treeSelect.scss
// (react-checkbox-tree 1.8 renders the nodes: li.rct-node > span.rct-text > button.rct-collapse-btn + .rct-title).

// One static option (properties.options item, treeSelect.js:347-394). Flags are saved as `{{true}}`/`{{false}}`
// bindings — the shape the Inspector writes and TreeSelect.jsx:121-133 resolves per node.
const flag = (on) => ({ value: on ? "{{true}}" : "{{false}}" });
const option = (label, value, { visible = true, disable = false, selected = false, expanded = false } = {}, children) => ({
  label,
  value,
  visible: flag(visible),
  disable: flag(disable),
  selected: flag(selected),
  expanded: flag(expanded),
  ...(children ? { children } : {}),
});

export const treeSelectText = {
  displayName: "Tree Select", // treeSelect.js:3
  componentType: "TreeSelect", // treeSelect.js:9
  defaultWidgetName: "treeselect1", // treeSelect.js:2 name → computeComponentName (appCanvasUtils.js:63)
  widgetPrefix: "treeselect",
  defaultGridWidth: 12, // treeSelect.js:6
  defaultHeight: 200, // treeSelect.js:7
  gridColumns: 43, // NO_OF_GRIDS (appCanvasConstants.js:1)
  boxPadding: 2, // RenderWidget.jsx:343 BOX_PADDING (appCanvasConstants.js:57) for padding 'default'
  rootPaddingY: 2, // TreeSelect.jsx:437 `tw-py-0.5` on the .custom-checkbox-tree root

  option,

  // Default static tree (treeSelect.js:347-394): Asia expanded + selected (cascades to every descendant)
  defaultTopTitles: ["Asia", "China", "Japan", "India", "Europe", "Africa"], // visible with only Asia expanded
  defaultChecked: ["asia", "china", "beijing", "shanghai", "japan", "india", "delhi", "mumbai", "bengaluru"],
  defaultExpanded: ["asia"], // treeSelect.js:354 Asia expanded

  // Saved definition defaults — the payload addTreeSelectsViaApi posts (treeSelect.js:319-412)
  definition: {
    others: {
      showOnDesktop: { value: "{{true}}" }, // treeSelect.js:321
      showOnMobile: { value: "{{false}}" }, // treeSelect.js:322
    },
    properties: {
      label: { value: "Countries" }, // treeSelect.js:331
      advanced: { value: "{{false}}" }, // treeSelect.js:332
      allowIndependentSelection: { value: "{{false}}" }, // treeSelect.js:337
      checkedData: { value: '{{["asia"]}}' }, // treeSelect.js:338
      expandedData: { value: '{{["asia"]}}' }, // treeSelect.js:339
      dynamicHeight: { value: "{{false}}" }, // treeSelect.js:340
      visibility: { value: "{{true}}" }, // treeSelect.js:341
      collapseWhenHidden: { value: "{{false}}" }, // treeSelect.js:343
      disabledState: { value: "{{false}}" }, // treeSelect.js:344
      tooltip: { value: "" }, // treeSelect.js:345
      tooltipFormat: { value: "plainText" }, // treeSelect.js:346
      // treeSelect.js:347-394 — the default static tree
      options: {
        value: [
          option("Asia", "asia", { selected: true, expanded: true }, [
            option("China", "china", {}, [option("Beijing", "beijing"), option("Shanghai", "shanghai")]),
            option("Japan", "japan"),
            option("India", "india", {}, [option("Delhi", "delhi"), option("Mumbai", "mumbai"), option("Bengaluru", "bengaluru")]),
          ]),
          option("Europe", "europe", {}, [option("France", "france"), option("Spain", "spain"), option("England", "england")]),
          option("Africa", "africa"),
        ],
      },
    },
    styles: {
      labelColor: { value: "var(--cc-primary-text)" }, // treeSelect.js:398
      labelFontSize: { value: "{{12}}" }, // treeSelect.js:399
      labelStyle: { value: "new" }, // treeSelect.js:400
      alignment: { value: "side" }, // treeSelect.js:401
      direction: { value: "left" }, // treeSelect.js:402
      autoLabelWidth: { value: "{{true}}" }, // treeSelect.js:403
      labelWidth: { value: "33" }, // treeSelect.js:404
      borderColor: { value: "var(--cc-default-border)" }, // treeSelect.js:405
      uncheckedBackground: { value: "var(--cc-surface1-surface)" }, // treeSelect.js:406
      checkboxColor: { value: "var(--cc-primary-brand)" }, // treeSelect.js:407
      checkmarkColor: { value: "var(--cc-surface1-surface)" }, // treeSelect.js:408
      textColor: { value: "var(--cc-primary-text)" }, // treeSelect.js:409
      padding: { value: "default" }, // treeSelect.js:410
      boxShadow: { value: "0px 0px 0px 0px #00000040" }, // treeSelect.js:411
    },
  },

  // Styles panel (treeSelect.js:266-279 padding switch)
  paddingDefault: "default", // treeSelect.js:275
  paddingNone: "none", // treeSelect.js:276

  // Computed values
  scrollOverflow: "auto", // treeSelect.scss:2 `.custom-checkbox-tree { overflow-y: auto }`
  fixedRootHeight: "100%", // TreeSelect.jsx:442 non-dynamic root height
  dynamicRootHeight: "auto", // TreeSelect.jsx:442 dynamic-height root height (view mode only, TreeSelect.jsx:73)
  checkboxRingSpread: 3, // TreeSelectCheckbox.jsx:57 tw-ring-2 + tw-ring-offset-1 → outermost box-shadow spread 3px
  toggleOutline: "2px solid", // treeSelect.scss:31-35 `.rct-collapse-btn:focus-visible` outline width + style
};

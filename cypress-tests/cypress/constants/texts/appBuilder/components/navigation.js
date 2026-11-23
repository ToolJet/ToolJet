// Texts for the Navigation widget. Config: packages/widget-definitions/src/widgets/navigation.js
// Runtime: frontend/src/AppBuilder/Widgets/Navigation/Navigation.jsx + hooks/useCalculateOverflow.js + utils.js
// Inspector: frontend/src/AppBuilder/RightSideBar/Inspector/Components/Navigation/** on the shared
// frontend/src/_ui/SortableTree (@dnd-kit).

// One menu item / group as the Inspector saves it (navigation.js:243-251). `visible` is the item's *Hide* flag
// (utils.js:12-13 isItemVisible: shown unless visible.value === '{{true}}').
const menuItem = (id, label, { caption, icon = "IconFile", hidden = false, disabled = false } = {}) => ({
  id,
  label,
  ...(caption !== undefined ? { caption } : {}),
  icon: { value: icon },
  iconVisibility: true,
  visible: { value: hidden ? "{{true}}" : "{{false}}" },
  disable: { value: disabled ? "{{true}}" : "{{false}}" },
  isGroup: false,
});
const menuGroup = (id, label, children, { icon = "IconFolder" } = {}) => ({
  ...menuItem(id, label, { icon }),
  isGroup: true,
  children,
});

// navigation.js:241-290 — the menu a freshly dropped Navigation starts with
const defaultMenuItems = [
  menuItem("item1", "Option 1", { icon: "IconArchive" }), // navigation.js:244-245
  menuItem("item2", "Option 2", { icon: "IconListDetails" }), // navigation.js:253-254
  menuGroup("group1", "Group 1", [
    menuItem("item3", "Option 3", { icon: "IconFileCode" }), // navigation.js:271-272
    menuItem("item4", "Option 4", { icon: "IconBulb" }), // navigation.js:280-281
  ]), // navigation.js:262-263
];

export const navigationText = {
  displayName: "Navigation", // navigation.js:3
  componentType: "Navigation", // navigation.js:5
  defaultWidgetName: "navigation1", // navigation.js:2 name → computeComponentName (appCanvasUtils.js:63)
  widgetPrefix: "navigation",
  defaultGridWidth: 20, // navigation.js:7
  defaultHeight: 60, // navigation.js:8

  menuItem,
  menuGroup,
  defaultMenuItems,
  // flattened Inspector tree of the default menu: [id, depth]
  defaultTree: [
    ["item1", 0],
    ["item2", 0],
    ["group1", 0],
    ["item3", 1],
    ["item4", 1],
  ],
  defaultTopLevelIds: ["item1", "item2", "group1"],

  // Saved definition defaults — the payload addNavigationsViaApi posts (navigation.js:235-320)
  definition: {
    others: {
      showOnDesktop: { value: "{{true}}" }, // navigation.js:237
      showOnMobile: { value: "{{false}}" }, // navigation.js:238
    },
    properties: {
      menuItems: { value: defaultMenuItems }, // navigation.js:241-290
      visibility: { value: "{{true}}" }, // navigation.js:292
      dynamicHeight: { value: "{{false}}" }, // navigation.js:293
      collapseWhenHidden: { value: "{{false}}" }, // navigation.js:294
      disabledState: { value: "{{false}}" }, // navigation.js:295
      loadingState: { value: "{{false}}" }, // navigation.js:296
    },
    styles: {
      unselectedTextColor: { value: "var(--cc-primary-text)" }, // navigation.js:300
      unselectedIconColor: { value: "var(--cc-default-icon)" }, // navigation.js:301
      hoverPillBackgroundColor: { value: "var(--cc-surface3-surface)" }, // navigation.js:302
      selectedTextColor: { value: "var(--cc-primary-brand)" }, // navigation.js:303
      selectedIconColor: { value: "var(--cc-primary-brand)" }, // navigation.js:304
      selectedPillBackgroundColor: { value: "var(--cc-surface2-surface)" }, // navigation.js:305
      pillBorderRadius: { value: "6" }, // navigation.js:306
      orientation: { value: "horizontal" }, // navigation.js:307
      displayStyle: { value: "textAndIcon" }, // navigation.js:308
      navItemSize: { value: "equalWidth" }, // navigation.js:309
      horizontalAlignment: { value: "left" }, // navigation.js:310
      verticalAlignment: { value: "center" }, // navigation.js:311
      backgroundColor: { value: "var(--cc-surface1-surface)" }, // navigation.js:315
      borderColor: { value: "var(--cc-weak-border)" }, // navigation.js:316
      borderRadius: { value: "8" }, // navigation.js:317
      padding: { value: "2" }, // navigation.js:318
    },
  },

  // Style option values (navigation.js:94-140)
  orientationHorizontal: "horizontal", // navigation.js:98
  orientationVertical: "vertical", // navigation.js:99
  navItemSizeAuto: "auto", // navigation.js:119
  navItemSizeEqualWidth: "equalWidth", // navigation.js:120

  // Overflow bucketing constants (useCalculateOverflow.js:41-42)
  flexGap: 6, // useCalculateOverflow.js:41 — CSS gap of .navigation-horizontal-list
  moreButtonReserve: 80, // useCalculateOverflow.js:42 — width reserved for the "More" button
  moreLabel: "More", // Navigation.jsx:681

  // Exposed values (navigation.js:190-196); selectedItem shape from applySelection (Navigation.jsx:396-401)
  selectedItemNull: "null",
  selectedItem: (id, label, groupId = null, groupLabel = null) => JSON.stringify({ id, label, groupId, groupLabel }),
};

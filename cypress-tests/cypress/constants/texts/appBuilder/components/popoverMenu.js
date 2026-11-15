// Texts for the Popover Menu widget. Config: packages/widget-definitions/src/widgets/popoverMenu.js
// Runtime: frontend/src/AppBuilder/Widgets/PopoverMenu/PopoverMenu.jsx + components/CustomButton.jsx +
// components/CustomOptions.jsx + popoverMenu.scss
// Static option shape (popoverMenu.js:329-359): { format, label, description, value, icon: { value },
// iconVisibility, disable: { value }, visible: { value } }
const option = (label, value, { description = "", icon = "IconBolt", disabled = false, visible = true } = {}) => ({
  format: "plain",
  label,
  description,
  value,
  icon: { value: icon },
  iconVisibility: false,
  disable: { value: disabled },
  visible: { value: visible },
});

export const popoverMenuText = {
  displayName: "Popover Menu", // popoverMenu.js:3
  componentType: "PopoverMenu", // popoverMenu.js:5
  defaultWidgetName: "popovermenu1", // popoverMenu.js:2 name → computeComponentName (appCanvasUtils.js)
  widgetPrefix: "popovermenu",
  defaultGridWidth: 6, // popoverMenu.js:7
  defaultHeight: 40, // popoverMenu.js:8
  defaultLabel: "Menu", // popoverMenu.js:320
  defaultOptionLabels: ["option1", "option2", "option3"], // popoverMenu.js:332,342,352
  buttonTypePrimary: "primary", // popoverMenu.js:26
  buttonTypeOutline: "outline", // popoverMenu.js:27
  triggerHover: "hover", // popoverMenu.js:36
  triggerClick: "click", // popoverMenu.js:37
  menuWidthCustom: "custom", // popoverMenu.js:258

  option,

  // Saved definition defaults — the payload addPopoverMenusViaApi posts (popoverMenu.js:314-391)
  definition: {
    others: {
      showOnDesktop: { value: "{{true}}" }, // popoverMenu.js:316
      showOnMobile: { value: "{{false}}" }, // popoverMenu.js:317
    },
    properties: {
      label: { value: "Menu" }, // popoverMenu.js:320
      buttonType: { value: "primary" }, // popoverMenu.js:321
      trigger: { value: "click" }, // popoverMenu.js:322
      advanced: { value: "{{false}}" }, // popoverMenu.js:323
      options: {
        // popoverMenu.js:328-361
        value: [
          option("option1", "1", { icon: "IconBolt" }),
          option("option2", "2", { icon: "IconBulb" }),
          option("option3", "3", { icon: "IconTag" }),
        ],
      },
      optionsLoadingState: { value: "{{false}}" }, // popoverMenu.js:362
      visibility: { value: "{{true}}" }, // popoverMenu.js:363
      disabledState: { value: "{{false}}" }, // popoverMenu.js:364
      loadingState: { value: "{{false}}" }, // popoverMenu.js:365
      tooltip: { value: "" }, // popoverMenu.js:366
      tooltipFormat: { value: "plainText" }, // popoverMenu.js:367
    },
    styles: {
      backgroundColor: { value: "var(--cc-primary-brand)" }, // popoverMenu.js:371
      hoverBackgroundMode: { value: "auto" }, // popoverMenu.js:372
      hoverBackgroundColor: { value: "var(--cc-primary-brand)" }, // popoverMenu.js:373
      textColor: { value: "#FFFFFF" }, // popoverMenu.js:374
      textSize: { value: "{{14}}" }, // popoverMenu.js:375
      fontWeight: { value: "normal" }, // popoverMenu.js:376
      borderColor: { value: "var(--cc-primary-brand)" }, // popoverMenu.js:377
      loaderColor: { value: "var(--cc-surface1-surface)" }, // popoverMenu.js:378
      contentAlignment: { value: "center" }, // popoverMenu.js:379
      icon: { value: "IconMenu2" }, // popoverMenu.js:380
      iconVisibility: { value: "{{true}}" }, // popoverMenu.js:381
      iconColor: { value: "#FFFFFF" }, // popoverMenu.js:382
      direction: { value: "left" }, // popoverMenu.js:383
      borderRadius: { value: "6" }, // popoverMenu.js:384
      boxShadow: { value: "0px 0px 0px 0px #00000040" }, // popoverMenu.js:385
      menuWidthMode: { value: "matchField" }, // popoverMenu.js:386
      menuCustomWidth: { value: "256" }, // popoverMenu.js:387
      optionsTextColor: { value: "var(--cc-primary-text)" }, // popoverMenu.js:388
      optionsIconColor: { value: "var(--cc-default-icon)" }, // popoverMenu.js:389
      optionsDescriptionColor: { value: "var(--cc-placeholder-text)" }, // popoverMenu.js:390
    },
  },

  // Theme tokens the trigger resolves its default colours from (CustomButton.jsx:47-75)
  tokens: {
    brand: "--cc-primary-brand", // popoverMenu.js:371,377 primary background + border
    textOnSolid: "--text-on-solid", // CustomButton.jsx:57 primary text at the '#FFFFFF' sentinel
    primaryText: "--cc-primary-text", // CustomButton.jsx:58 outline text; popoverMenu.js:388 option label
    defaultBorder: "--cc-default-border", // CustomButton.jsx:51 outline border at the brand sentinel
    surface: "--cc-surface1-surface", // popoverMenu.js:378 primary loader; popoverMenu.scss:3 menu surface
    placeholderText: "--cc-placeholder-text", // popoverMenu.js:390 option description
    focusOutline: "--interactive-focus-outline", // CustomButton.jsx:160 focus-visible:tw-outline-interactive-focus-outline
  },
  // the computed box-shadow of the default boxShadow '0px 0px 0px 0px #00000040' (popoverMenu.js:385)
  defaultBoxShadowCss: "rgba(0, 0, 0, 0.25) 0px 0px 0px 0px",
  transparent: "rgba(0, 0, 0, 0)",

  listMaxHeight: 323, // CustomOptions.jsx:132 — listbox maxHeight
  collisionPadding: 8, // PopoverMenu.jsx:224
  sideOffset: 2, // PopoverMenu.jsx:212 (+ popoverMenu.scss:12 margin-top 2px)
  focusOutlineWidth: "2px", // CustomButton.jsx:160 focus-visible:tw-outline-2
  focusOutlineOffset: "2px", // CustomButton.jsx:160 focus-visible:tw-outline-offset-2
};

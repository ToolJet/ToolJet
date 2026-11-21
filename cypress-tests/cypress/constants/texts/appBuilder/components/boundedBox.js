// Texts for the Bounded Box widget (frontend/src/AppBuilder/Widgets/BoundedBox/).
export const boundedBoxText = {
  // packages/widget-definitions/src/widgets/boundedBox.js:3
  displayName: "Bounded Box",
  // boundedBox.js:2 `name: 'BoundedBox'` → runtime name boundedbox1
  defaultWidgetName: "boundedbox1",
  widgetPrefix: "boundedbox",
  // boundedBox.js:121 — definition default Image URL of a freshly dropped Bounded Box (served locally by the specs)
  defaultImageUrl:
    "https://burst.shopifycdn.com/photos/three-cars-are-parked-on-stone-paved-street.jpg?width=746&format=pjpg&exif=1&iptc=1",
  defaultImageUrlGlob: "https://burst.shopifycdn.com/photos/**",
  // boundedBox.js:7-8 — default size (width in grid columns, height in px)
  defaultSize: { width: 30, height: 420 },

  // boundedBox.js:112-130 — definition defaults, merged under every API-seeded Bounded Box
  definition: {
    properties: {
      defaultValue: {
        value:
          "{{[\t{type: 'RECTANGLE',width: 40,height:24, x:41,y:62,text:'Car'},{type: 'RECTANGLE',width: 40,height:24, x:41,y:12,text:'Tree'}\t]}}",
      },
      imageUrl: {
        value:
          "https://burst.shopifycdn.com/photos/three-cars-are-parked-on-stone-paved-street.jpg?width=746&format=pjpg&exif=1&iptc=1",
      },
      selector: { value: "RECTANGLE" },
      labels: { value: "{{['Tree', 'Car', 'Stree light']}}" },
      collapseWhenHidden: { value: "{{false}}" },
    },
    styles: {
      visibility: { value: "{{true}}" },
      disabledState: { value: "{{false}}" },
    },
    others: {
      showOnDesktop: { value: "{{true}}" },
      showOnMobile: { value: "{{false}}" },
    },
  },

  // boundedBox.js:31-34 — selector option values
  selectorRectangle: "RECTANGLE",
  selectorPoint: "POINT",
  // RenderEditor.jsx:32 / RenderHighlight.jsx:41 — label controls never shrink below 125px
  labelControlMinWidth: 125,
  // RenderHighlight.jsx:17 — a POINT highlight is drawn as a 2% x 2% dot
  pointHighlightSize: 2,

  // frontend/assets/images/logo-color.svg — a real same-origin asset served by the frontend
  sameOriginImage: "/assets/images/logo-color.svg",
  // dynamic: an 80x40 solid PNG as documented base64 image data (docs: "base64 image data")
  base64Png:
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAAAoCAIAAADmAupWAAAARElEQVR42u3PQQ0AAAgEoMtnOuvZxhZ+ZKMAma5XIiwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsfGsBf6A+vLS3JNQAAAAASUVORK5CYII=",
  base64PngSize: { width: 80, height: 40 },
};

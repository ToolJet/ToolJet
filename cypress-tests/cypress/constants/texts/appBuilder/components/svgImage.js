// Texts for the Svg Image widget (packages/widget-definitions/src/widgets/svgImage.js).
export const svgImageText = {
  // source: svgImage.js:3
  displayName: "Svg Image",
  defaultWidgetName: "svgimage1",
  widgetPrefix: "svgimage",
  // source: svgImage.js:24-25 — defaultSize of a dropped Svg Image (height in px, width in grid columns)
  defaultSize: { width: 4, height: 50 },
  // source: RenderWidget.jsx:356 — the widget's own container is drawn `widgetHeight - 4` px tall
  containerInset: 4,
  // source: svgImage.js:59 — the default vector's first <rect> (identifies the default drawing)
  defaultRect: { x: "4", y: "4", width: "6", height: "6" },

  // source: svgImage.js:52-68 — definition defaults of a freshly dropped Svg Image, used when seeding apps via API
  definition: {
    properties: {
      data: {
        value:
          '<svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /><line x1="14" y1="7" x2="20" y2="7" /><line x1="17" y1="4" x2="17" y2="10" /></svg>',
      },
      collapseWhenHidden: { value: "{{false}}" },
    },
    styles: {
      visibility: { value: "{{true}}" },
      alignment: { value: "left" },
    },
    others: {
      showOnDesktop: { value: "{{true}}" },
      showOnMobile: { value: "{{false}}" },
    },
  },

  // Oversized vector for the clipping scenario: a solid 600x600 square drawn from the container's top-left.
  // No viewBox on purpose: the role="img" flex row (SvgImage.jsx:12) shrinks the <svg> box to the container
  // width, and without a viewBox the drawing keeps its user units instead of being rescaled into that box.
  oversizedSize: 600,
  oversizedSvg:
    "<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'><rect class='big' width='600' height='600' fill='#d94a4a'/></svg>",
};

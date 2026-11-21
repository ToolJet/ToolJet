// Texts for the Image widget.
export const imageText = {
  // packages/widget-definitions/src/widgets/image.js:3
  displayName: "Image",
  defaultWidgetName: "image1",
  widgetPrefix: "image",
  // image.js:283 — definition default Source URL of a freshly dropped Image (served locally by the specs)
  defaultSource: "https://www.svgrepo.com/show/34217/image.svg",
  // image.js:7 — default height of a dropped Image
  defaultHeight: 240,

  // Fixture apps (cypress/fixtures/templates/appbuilderApps/), built with SVG data-URI images so nothing
  // loads from the network. Layout tops/heights in px, `left` in % of the canvas, width in grid columns.
  //   imageDynamicHeight.json: image1 (dynamicHeight on, 200x400 portrait) top 30 h 240 → text1 top 290;
  //                            image2 (same image, dynamicHeight off) top 30 h 240 → text2 top 290
  dynamicHeightFixture: "templates/appbuilderApps/imageDynamicHeight.json",
  //   imageLazyLoad.json: text1 top 30; image1 (top-level, 200x200) top 3000 (canvasMaxHeight 4000)
  lazyLoadFixture: "templates/appbuilderApps/imageLazyLoad.json",
  //   imageZoom.json: image1 (zoomButtons on) and image2 (zoomButtons on + disabledState on), both 400x300
  //   at top 30 h 300; each onClick sets variables.imageClicked = its own name; text1 shows
  //   'clicked:' + (variables.imageClicked ?? 'none')
  zoomFixture: "templates/appbuilderApps/imageZoom.json",
  dynamic: {
    authoredHeight: 240,
    naturalRatio: 2, // 400 / 200 (portrait SVG)
    siblingGap: 20, // text top 290 − (30 + 240)
  },
  lazy: { naturalWidth: 200 },
  zoom: {
    maxScale: 8, // react-zoom-pan-pinch default maxScale (TransformWrapper has no override, Image.jsx:313)
    clickedNone: "clicked:none",
    clickedImage1: "clicked:image1",
  },
};

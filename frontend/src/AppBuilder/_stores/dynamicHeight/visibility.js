// Whether a widget is visible at one row context. Several sources can say so;
// the first one set wins:
//
//   1. exposed `isVisible`   what a `setVisibility` action set at runtime
//   2. properties.visibility the Visibility property
//   3. styles.visibility     where older widgets kept it
//
// and "Show on desktop/mobile" turned off for the current layout hides the
// widget whatever the others say. Nothing set means visible.
//
// The getters are the App Builder store's, already bound to the widget's
// module, so this stays pure and works for any module or row.
export const resolveWidgetVisibility = ({
  componentId,
  contextIndices,
  currentLayout,
  getResolvedComponent,
  getExposedPropertyForAdditionalActions,
}) => {
  const component = getResolvedComponent(componentId, contextIndices);
  const showOnThisLayout = currentLayout === 'mobile' ? 'showOnMobile' : 'showOnDesktop';
  if (component?.others?.[showOnThisLayout] === false) return false;

  const exposedVisibility = getExposedPropertyForAdditionalActions(componentId, contextIndices, 'isVisible');
  return exposedVisibility ?? component?.properties?.visibility ?? component?.styles?.visibility ?? true;
};

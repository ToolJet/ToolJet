const BETA_WIDGETS = new Set(['FlexContainer']);

export const getWidgetVersionLabel = (componentType) => (BETA_WIDGETS.has(componentType) ? 'Beta' : null);

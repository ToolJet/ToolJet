// Empty module fallback for edition-based imports
// This module is used when EE or Cloud features are not available in CE edition

const emptyComponent = () => null;
const emptyFunction = () => {};
const emptyObject = {};
const emptyArray = [];

// Mark this as an empty module for the edition system to detect
const emptyModuleMarker = {
  name: 'Empty Module',
  isEmpty: true,
  edition: 'fallback'
};

// Default export for components
export default emptyComponent;

// Named exports for various use cases
export {
  emptyComponent as Component,
  emptyFunction as func,
  emptyFunction as action,
  emptyFunction as handler,
  emptyFunction as service,
  emptyFunction as hook,
  emptyFunction as util,
  emptyObject as config,
  emptyObject as constants,
  emptyObject as store,
  emptyArray as list,
  emptyArray as data,
  emptyModuleMarker as name
};

// Common EE/Cloud component patterns
export const Modal = emptyComponent;
export const Page = emptyComponent;
export const Container = emptyComponent;
export const Provider = emptyComponent;
export const HOC = (WrappedComponent) => WrappedComponent;
export const withFeature = (WrappedComponent) => WrappedComponent;

// Posthog helper compatibility (as seen in getEditionSpecificHelper.js)
export const posthogInit = emptyFunction;
export const posthogIdentify = emptyFunction;
export const posthogTrack = emptyFunction;
export const posthogCapture = emptyFunction;

// Store/slice compatibility
export const createSlice = () => ({
  name: 'empty',
  initialState: {},
  reducers: {},
  actions: {}
});

// Component with props support
export const EmptyComponentWithProps = (props) => {
  // Pass through children if provided, otherwise return null
  return props?.children || null;
};
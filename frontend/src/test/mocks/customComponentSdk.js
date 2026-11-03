// A component pack's own source imports the SDK from '@tooljet/custom-component-sdk'; inline in ToolJet the runtime
// provides it (window.__tj_ToolJet). Tests that render a pack component take the same SDK.
export { toolJetSdk as ToolJet } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';

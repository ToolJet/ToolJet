// A component pack's own source imports the SDK from '@tooljet/custom-component-sdk'; inline in ToolJet the runtime
// provides it (window.__tj_ToolJet). Tests that render a pack component take the same SDK.
import { toolJetSdk } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';

export { toolJetSdk as ToolJet };
export const useToolJetTheme = () => toolJetSdk.useTheme();

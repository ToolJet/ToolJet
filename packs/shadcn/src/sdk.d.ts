// The ToolJet runtime has useEditing; the published SDK types (0.1.0-beta.3) do not yet. Delete once the SDK declares it.
import '@tooljet/custom-component-sdk';

declare module '@tooljet/custom-component-sdk/dist/types' {
  interface ToolJetSDK {
    /** True in the editor, false in a viewer or a released app. */
    useEditing(): boolean;
  }
}

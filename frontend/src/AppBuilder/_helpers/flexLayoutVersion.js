// FlexContainer layout versions.
//
// ToolJet UI 2.0 changed how a FlexContainer lays out its children: fill-width children share a row, a row fits its
// content, a column does not wrap, a hidden child takes no space, the widget's box padding counts towards its height,
// and a dialog without its trigger leaves the flow. FlexContainers saved before that (released on lts-3.16) keep the
// lts-3.16 layout. The widget's default definition writes `layoutVersion: '2'`, so every container created since
// (dropped from the panel in either library, or created by the MCP and AI, which take the definition defaults) carries
// it and gets the new layout. It is an ordinary property, so it survives copy and paste, export and import, and a
// library switch.
//
// Every branch between the two layouts reads `usesFlexLayoutV2`. Once old containers are migrated, drop the old
// branches, this file, and the flag.

/** The layout version a new FlexContainer is created with (its default definition). */
export const FLEX_LAYOUT_V2 = '2';

/**
 * Whether a FlexContainer uses the UI 2.0 layout. Takes its resolved properties ({ layoutVersion: '2' }) or its
 * definition's ({ layoutVersion: { value: '2' } }); absent (a container saved before UI 2.0) is the lts-3.16 layout.
 * @param {Record<string, unknown> | undefined} properties
 * @returns {boolean}
 */
export const usesFlexLayoutV2 = (properties) => {
  const raw = properties?.layoutVersion;
  const value = raw !== null && typeof raw === 'object' ? raw.value : raw;
  return Number(value) >= Number(FLEX_LAYOUT_V2);
};

// A saved container keeps its layout when the widget defaults are merged into it (shared with the server's merge).
export { dropNewContainerDefaults } from '@tooljet/widget-definitions';

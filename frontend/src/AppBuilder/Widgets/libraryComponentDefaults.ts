import type { ManifestProp } from '@/AppBuilder/types/libraryComponent.types';

// The definition value a manifest prop or style default is stored as: stamped at drop time
// (addNewWidgetToTheEditor) and shown by the Inspector for keys an instance hasn't saved yet.
// Mirrors LibraryComponent Inspector's fieldMeta() type→field mapping so the stamped
// value matches what that field type expects (dropdown.js/checkbox.js precedent):
// toggle → '{{bool}}', select → raw string, code → raw string (string) or '{{json}}' (else).
export const manifestDefaultToDefinitionValue = (prop: ManifestProp): unknown => {
  // TODO: prop.default is undefined both when
  // the author never set a useStateX initialValue AND when they set one the CLI's manifest
  // generator can't statically resolve (template literal, computed expr, imported constant
  // — evalLiteralNode in manifest-generator.ts). The '' /'{{false}}' fallback below is
  // correct for the former and silently wrong for the latter (it permanently overrides the
  // shell's real runtime initialValue for that prop). Decided to keep current behavior for
  // now rather than risk downstream undefined-handling issues; future fix is to have the
  // generator distinguish "not set" from "unresolved" (e.g. a `defaultUnresolved` flag) and
  // surface a warning icon/tooltip on the Inspector field for the latter case, rather than
  // silently guessing a fallback value.
  if (prop.default === undefined) return prop.type === 'boolean' ? '{{false}}' : '';
  if (prop.type === 'boolean') return `{{${prop.default}}}`;
  if (prop.type === 'enumeration' || prop.type === 'string') return prop.default;
  return `{{${JSON.stringify(prop.default)}}}`; // number | object | array
};

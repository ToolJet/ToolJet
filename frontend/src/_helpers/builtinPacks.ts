import config from 'config';

// Component packs ship with ToolJet like native widgets (server modules/builtin-packs): the release builds each pack
// with the custom-component CLI and serves its files under their content hash, so an upgrade reaches every app and
// there is no library, licence or version to pick. A PackComponent instance names only its pack and component.

export interface BuiltinPack {
  pack: string;
  displayName: string;
  version: string;
  hash: string;
  hasCss: boolean;
}

export type PackFile = 'index.js' | 'index.css' | 'manifest.json';

/** Where the shipped file of a pack is served; the hash in the path makes it cacheable for good. */
export const packFileUrl = (pack: BuiltinPack, file: PackFile): string =>
  `${config.apiUrl}/builtin-packs/${pack.pack}/${pack.hash}/${file}`;

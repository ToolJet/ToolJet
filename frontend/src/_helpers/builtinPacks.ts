// Built-in component packs ship with ToolJet like native widgets (server builtin-packs.ts): an instance names its pack
// as `builtin:<pack>` in place of a workspace library, the same in every workspace, and is never pinned to a version.
// Its "revision" is `builtin:<hash>` of the files the server ships, so an upgrade reaches every app.

export const BUILTIN_PREFIX = 'builtin:';

export interface BuiltinPack {
  pack: string;
  displayName: string;
  version: string;
  hash: string;
  hasCss: boolean;
}

/** pack → content hash of the shipped files, as the server lists them. */
export type BuiltinHashes = Record<string, string>;

export const isBuiltinLibrary = (id: string | undefined): boolean => !!id?.startsWith?.(BUILTIN_PREFIX);

export const builtinPackOf = (id: string): string => id.slice(BUILTIN_PREFIX.length);

export const builtinIdentity = (pack: string): { libraryId: string; correlationId: string } => ({
  libraryId: `${BUILTIN_PREFIX}${pack}`,
  correlationId: `${BUILTIN_PREFIX}${pack}`,
});

/** The shipped version of a built-in pack, or undefined until the server has listed its packs. */
export const builtinRevision = (correlationId: string, hashes: BuiltinHashes | undefined): string | undefined => {
  const hash = hashes?.[builtinPackOf(correlationId)];
  return hash ? `${BUILTIN_PREFIX}${hash}` : undefined;
};

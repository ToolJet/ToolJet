import config from 'config';
import { handleResponse } from '@/_helpers';
import { packFileUrl, type BuiltinPack } from '@/_helpers/builtinPacks';
import type { LibraryManifest } from '@/AppBuilder/types/libraryComponent.types';

// The packs that ship with this release (server modules/builtin-packs): no login needed, public apps load them too.
function list(): Promise<BuiltinPack[]> {
  return fetch(`${config.apiUrl}/builtin-packs`, { method: 'GET', credentials: 'include' as const }).then(
    handleResponse
  );
}

function getManifest(pack: BuiltinPack): Promise<LibraryManifest> {
  return fetch(packFileUrl(pack, 'manifest.json'), { method: 'GET' }).then(handleResponse);
}

export const builtinPacksService = { list, getManifest };

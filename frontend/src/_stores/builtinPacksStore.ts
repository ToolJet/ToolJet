import { useEffect } from 'react';
import { create, zustandDevTools } from './utils';
import { builtinPacksService } from '@/_services/builtinPacks.service';
import type { BuiltinPack } from '@/_helpers/builtinPacks';
import type { LibraryManifest } from '@/AppBuilder/types/libraryComponent.types';

// The packs this release ships and their manifests. Both only change with a server release, so each is fetched once
// per page load and shared by the canvas, the Inspector, the event manager and the Components panel.
interface BuiltinPacksState {
  packs: BuiltinPack[] | null; // null = not yet listed
  manifests: Record<string, LibraryManifest>; // by pack id
  fetchPacks: () => Promise<BuiltinPack[]>;
  fetchManifest: (pack: string) => Promise<void>;
}

let packsInFlight: Promise<BuiltinPack[]> | null = null;
const manifestsInFlight = new Map<string, Promise<void>>();

export const useBuiltinPacksStore = create(
  zustandDevTools(
    (set: any, get: any): BuiltinPacksState => ({
      packs: null,
      manifests: {},

      fetchPacks: () => {
        const { packs } = get();
        if (packs !== null) return Promise.resolve(packs);
        packsInFlight ??= builtinPacksService
          .list()
          .then((listed) => {
            const list = Array.isArray(listed) ? listed : [];
            set({ packs: list }, false, 'fetchPacks');
            return list;
          })
          // A failed listing leaves `packs` unset, so the next caller asks again.
          .catch(() => [])
          .finally(() => {
            packsInFlight = null;
          });
        return packsInFlight;
      },

      fetchManifest: async (packId) => {
        if (get().manifests[packId]) return;
        if (manifestsInFlight.has(packId)) return manifestsInFlight.get(packId);
        const promise = get()
          .fetchPacks()
          .then((packs: BuiltinPack[]) => {
            const pack = packs.find((p) => p.pack === packId);
            return pack ? builtinPacksService.getManifest(pack) : null;
          })
          .then((manifest: LibraryManifest | null) => {
            if (manifest)
              set(
                (state: BuiltinPacksState) => ({ manifests: { ...state.manifests, [packId]: manifest } }),
                false,
                'fetchManifest'
              );
          })
          .catch(() => {})
          .finally(() => manifestsInFlight.delete(packId));
        manifestsInFlight.set(packId, promise);
        return promise;
      },
    }),
    { name: 'builtinPacksStore' }
  )
);

/** The packs this release ships ([] until listed). */
export const useBuiltinPacks = (): BuiltinPack[] => {
  const packs = useBuiltinPacksStore((state: BuiltinPacksState) => state.packs);
  useEffect(() => {
    useBuiltinPacksStore.getState().fetchPacks();
  }, []);
  return packs ?? [];
};

/** One shipped pack, or undefined until the packs are listed (or when this release has no such pack). */
export const useBuiltinPack = (packId: string | undefined): BuiltinPack | undefined => {
  const packs = useBuiltinPacks();
  return packId ? packs.find((pack) => pack.pack === packId) : undefined;
};

/** A shipped pack's manifest, or null until it is fetched. */
export const usePackManifest = (packId: string | undefined): LibraryManifest | null => {
  const manifest = useBuiltinPacksStore((state: BuiltinPacksState) => (packId ? state.manifests[packId] : undefined));
  useEffect(() => {
    if (packId) useBuiltinPacksStore.getState().fetchManifest(packId);
  }, [packId]);
  return manifest ?? null;
};

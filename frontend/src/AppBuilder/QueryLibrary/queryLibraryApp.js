import { appsService } from '@/_services';
import { fetchEdition } from '@/modules/common/helpers/utils';
import { getSubpath } from '@/_helpers/routes';

// The query library is EE/Cloud only in the UI (no tab, route or picker entry in CE).
export const isQueryLibraryEnabled = () => fetchEdition() !== 'ce';

// Raw hrefs (new tab) bypass the router, so they need the deployment sub-path.
export const libraryAppUrl = (path) => `${getSubpath() ?? ''}${path}`;

// A workspace has exactly one query library app (one version). Returns its ids, or null when none exists yet.
export async function findQueryLibrary() {
  const data = await appsService.getAll(1, '', '', 'query_library', 'picker');
  const app = data?.apps?.[0];
  const versionId = app?.app_versions?.[0]?.id;
  return app && versionId ? { id: app.id, slug: app.slug, versionId } : null;
}

export async function getOrCreateQueryLibrary() {
  const existing = await findQueryLibrary();
  if (existing) return existing;
  try {
    await appsService.createApp({ type: 'query_library', name: 'Query library' });
  } catch (err) {
    // Lost a race with another creator (400 "This workspace already has a query library"): use theirs.
    const raced = await findQueryLibrary().catch(() => null);
    if (raced) return raced;
    throw err;
  }
  const created = await findQueryLibrary();
  if (!created) throw new Error('Could not create the query library');
  return created;
}

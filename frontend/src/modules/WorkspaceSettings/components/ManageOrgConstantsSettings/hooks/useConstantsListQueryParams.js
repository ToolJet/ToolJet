import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useConstantsListStore } from '../store/constantsListStore';

export const CONSTANT_TABS = ['Global', 'Secret'];
export const CONSTANT_SORTS = ['name_asc', 'name_desc', 'modified_desc', 'modified_asc'];
export const CONSTANT_SOURCES = ['workspace', 'env'];

const DEFAULTS = { env: null, tab: 'Secret', sort: 'modified_desc', source: CONSTANT_SOURCES };
export const DEFAULT_SORT = DEFAULTS.sort;

const storageKey = (workspaceId) => `tj:constants-view:${workspaceId}`;

// Per-tab: a new tab or a later visit starts from the defaults, a refresh or a return within the tab restores the view.
// Storage can be blocked (private mode, disabled site data); the view then lives in the URL only.
function readSavedView(workspaceId) {
  try {
    return JSON.parse(sessionStorage.getItem(storageKey(workspaceId))) ?? {};
  } catch {
    return {};
  }
}

function saveView(workspaceId, view) {
  try {
    sessionStorage.setItem(storageKey(workspaceId), JSON.stringify(view));
  } catch {
    // The URL still holds the view for this session.
  }
}

// Keeps known sources in canonical order; an empty result means "no valid value".
const parseSource = (value) => {
  const values = Array.isArray(value) ? value : String(value ?? '').split(',');
  return CONSTANT_SOURCES.filter((source) => values.includes(source));
};

// Hand-edited URLs and stale saved views may carry unknown values; those fall through to the next candidate.
const pickTab = (...candidates) => candidates.find((value) => CONSTANT_TABS.includes(value)) ?? DEFAULTS.tab;
const pickSort = (...candidates) => candidates.find((value) => CONSTANT_SORTS.includes(value)) ?? DEFAULTS.sort;
const pickEnv = (...candidates) => candidates.find((value) => typeof value === 'string' && value) ?? DEFAULTS.env;
const pickSource = (...candidates) => candidates.map(parseSource).find((sources) => sources.length) ?? DEFAULTS.source;

const isDefault = (key, value) =>
  key === 'source' ? value.length === CONSTANT_SOURCES.length : value === DEFAULTS[key];

const VIEW_KEYS = ['env', 'tab', 'sort', 'source'];

// `env` has no entry: only the caller knows which environments exist.
const IS_VALID = {
  tab: (value) => CONSTANT_TABS.includes(value),
  sort: (value) => CONSTANT_SORTS.includes(value),
  source: (value) => parseSource(value).length > 0,
};

// Environment, tab, sort and source live in the URL so they survive refresh and sharing. A plain visit restores the
// view saved for the workspace by copying it into the URL once, on mount; after that only the URL is read, so a
// second tab stays independent and choosing a default (which leaves the URL) is not undone by an older saved value.
// A URL param wins over the saved value; an unknown one is removed on mount. `env` is not validated here: the
// caller knows the workspace's environments, supplies the default, and removes an unknown `env` itself.
export function useConstantsListQueryParams({ workspaceId }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const setPage = useConstantsListStore((state) => state.setPage);

  // Until the seeding effect has run, the saved view fills in for params the URL does not have yet, so the very
  // first render already shows (and fetches) the right view.
  const [savedAtMount] = useState(() => readSavedView(workspaceId));
  const [seeded, setSeeded] = useState(false);
  const saved = seeded ? {} : savedAtMount;

  const env = pickEnv(searchParams.get('env'), saved.env);
  const tab = pickTab(searchParams.get('tab'), saved.tab);
  const sort = pickSort(searchParams.get('sort'), saved.sort);
  const sourceKey = pickSource(searchParams.get('source'), saved.source).join(',');
  // Memoized on its contents so consumers can depend on `source` without refetching every render.
  const source = useMemo(() => sourceKey.split(','), [sourceKey]);

  useEffect(() => {
    const seed = {
      env: pickEnv(savedAtMount.env),
      tab: pickTab(savedAtMount.tab),
      sort: pickSort(savedAtMount.sort),
      source: pickSource(savedAtMount.source),
    };
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current);
        VIEW_KEYS.forEach((key) => {
          // An unknown value is dropped so the URL matches the view, and the saved value can take its place.
          if (IS_VALID[key] && params.has(key) && !IS_VALID[key](params.get(key))) params.delete(key);
          if (!params.has(key) && !isDefault(key, seed[key])) {
            params.set(key, key === 'source' ? seed[key].join(',') : seed[key]);
          }
        });
        return params;
      },
      { replace: true }
    );
    setSeeded(true);
    // Once per mount: the saved view is a snapshot of the visit's start.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateView = useCallback(
    (key, value) => {
      const next = { env, tab, sort, source, [key]: value };
      // Saved before the URL changes, so choosing a default (which leaves the URL) is not overridden by an older saved value.
      saveView(workspaceId, next);
      // Functional update keeps unrelated params such as `branch`; replace avoids a history entry per click.
      setSearchParams(
        (current) => {
          const params = new URLSearchParams(current);
          if (isDefault(key, value)) params.delete(key);
          else params.set(key, key === 'source' ? value.join(',') : value);
          return params;
        },
        { replace: true }
      );
      // setPage also clears the selection.
      setPage(1);
    },
    [env, tab, sort, source, workspaceId, setSearchParams, setPage]
  );

  const setEnv = useCallback((value) => updateView('env', value || null), [updateView]);
  const setTab = useCallback((value) => updateView('tab', pickTab(value)), [updateView]);
  const setSort = useCallback((value) => updateView('sort', pickSort(value)), [updateView]);
  const setSource = useCallback((value) => updateView('source', pickSource(value)), [updateView]);

  return { env, tab, sort, source, setEnv, setTab, setSort, setSource };
}

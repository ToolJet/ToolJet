import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ConstantSort, ConstantSource, ConstantType } from '@/_services/types/organizationConstantsV2.types';
import { useConstantsListStore } from '../store/constantsListStore';
import { ConstantTypes } from '../helpers/constantType';

export const CONSTANT_TABS: ConstantType[] = [ConstantTypes.Global, ConstantTypes.Secret];
export const CONSTANT_SORTS: ConstantSort[] = ['name_asc', 'name_desc', 'modified_desc', 'modified_asc'];
export const CONSTANT_SOURCES: ConstantSource[] = ['workspace', 'env'];

interface ConstantsView {
  env: string | null;
  tab: ConstantType;
  sort: ConstantSort;
  source: ConstantSource[];
}
type ViewKey = keyof ConstantsView;

const DEFAULTS: ConstantsView = {
  env: null,
  tab: ConstantTypes.Secret,
  sort: 'modified_desc',
  source: CONSTANT_SOURCES,
};
export const DEFAULT_SORT = DEFAULTS.sort;

const storageKey = (workspaceId: string) => `tj:constants-view:${workspaceId}`;

const isOneOf = <Value extends string>(list: readonly Value[], value: unknown): value is Value =>
  list.includes(value as Value);

// Per-tab: a new tab or a later visit starts from the defaults, a refresh or a return within the tab restores the view.
// Storage can be blocked (private mode, disabled site data); the view then lives in the URL only.
function readSavedView(workspaceId: string): Record<string, unknown> {
  try {
    return JSON.parse(sessionStorage.getItem(storageKey(workspaceId)) ?? 'null') ?? {};
  } catch {
    return {};
  }
}

function saveView(workspaceId: string, view: ConstantsView) {
  try {
    sessionStorage.setItem(storageKey(workspaceId), JSON.stringify(view));
  } catch {
    // The URL still holds the view for this session.
  }
}

// Keeps known sources in canonical order; an empty result means "no valid value".
const parseSource = (value: unknown): ConstantSource[] => {
  const values = Array.isArray(value) ? value : String(value ?? '').split(',');
  return CONSTANT_SOURCES.filter((source) => values.includes(source));
};

// Hand-edited URLs and stale saved views may carry unknown values; those fall through to the next candidate.
const pickTab = (...candidates: unknown[]): ConstantType =>
  candidates.find((value): value is ConstantType => isOneOf(CONSTANT_TABS, value)) ?? DEFAULTS.tab;
const pickSort = (...candidates: unknown[]): ConstantSort =>
  candidates.find((value): value is ConstantSort => isOneOf(CONSTANT_SORTS, value)) ?? DEFAULTS.sort;
const pickEnv = (...candidates: unknown[]): string | null =>
  candidates.find((value): value is string => typeof value === 'string' && value !== '') ?? DEFAULTS.env;
const pickSource = (...candidates: unknown[]): ConstantSource[] =>
  candidates.map(parseSource).find((sources) => sources.length) ?? DEFAULTS.source;

const isDefault = <Key extends ViewKey>(key: Key, value: ConstantsView[Key]): boolean =>
  key === 'source' ? (value as ConstantSource[]).length === CONSTANT_SOURCES.length : value === DEFAULTS[key];

const VIEW_KEYS: ViewKey[] = ['env', 'tab', 'sort', 'source'];

// `env` has no entry: only the caller knows which environments exist.
const IS_VALID: Partial<Record<ViewKey, (value: string | null) => boolean>> = {
  tab: (value) => isOneOf(CONSTANT_TABS, value),
  sort: (value) => isOneOf(CONSTANT_SORTS, value),
  source: (value) => parseSource(value).length > 0,
};

// Environment, tab, sort and source live in the URL so they survive refresh and sharing. A plain visit restores the
// view saved for the workspace by copying it into the URL once, on mount; after that only the URL is read, so a
// second tab stays independent and choosing a default (which leaves the URL) is not undone by an older saved value.
// A URL param wins over the saved value; an unknown one is removed on mount. `env` is not validated here: the
// caller knows the workspace's environments, supplies the default, and removes an unknown `env` itself.
export function useConstantsListQueryParams({ workspaceId }: { workspaceId: string }) {
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
  const source = useMemo(() => sourceKey.split(',') as ConstantSource[], [sourceKey]);

  useEffect(() => {
    const seed: ConstantsView = {
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
          const isValid = IS_VALID[key];
          if (isValid && params.has(key) && !isValid(params.get(key))) params.delete(key);
          if (!params.has(key) && !isDefault(key, seed[key])) {
            params.set(key, key === 'source' ? seed.source.join(',') : String(seed[key]));
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
    <Key extends ViewKey>(key: Key, value: ConstantsView[Key]) => {
      const next: ConstantsView = { env, tab, sort, source, [key]: value };
      // Saved before the URL changes, so choosing a default (which leaves the URL) is not overridden by an older saved value.
      saveView(workspaceId, next);
      // Functional update keeps unrelated params such as `branch`; replace avoids a history entry per click.
      setSearchParams(
        (current) => {
          const params = new URLSearchParams(current);
          if (isDefault(key, value)) params.delete(key);
          else params.set(key, key === 'source' ? (value as ConstantSource[]).join(',') : String(value));
          return params;
        },
        { replace: true }
      );
      // setPage also clears the selection.
      setPage(1);
    },
    [env, tab, sort, source, workspaceId, setSearchParams, setPage]
  );

  const setEnv = useCallback((value: string | null | undefined) => updateView('env', value || null), [updateView]);
  const setTab = useCallback((value: unknown) => updateView('tab', pickTab(value)), [updateView]);
  const setSort = useCallback((value: unknown) => updateView('sort', pickSort(value)), [updateView]);
  const setSource = useCallback((value: unknown) => updateView('source', pickSource(value)), [updateView]);

  return { env, tab, sort, source, setEnv, setTab, setSort, setSource };
}

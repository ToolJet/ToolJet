import React, { useEffect, useMemo, useState } from 'react';
import Select from '@/_ui/Select';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { libraryQueryService } from '@/_services';
import { queryLibraryUrl } from '@/AppBuilder/QueryLibrary/queryLibraryApp';

const NO_FOLDER = 'No folder';
const DRAFT_LABEL = 'Draft (testing only)';

// Folders alphabetical, "No folder" last.
function groupByFolder(queries) {
  const groups = new Map();
  queries.forEach((query) => {
    const label = query.folder ?? NO_FOLDER;
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push({ value: query.id, label: query.name });
  });
  return [...groups.entries()]
    .sort(([a], [b]) => (a === NO_FOLDER) - (b === NO_FOLDER) || a.localeCompare(b))
    .map(([label, options]) => ({ label, options }));
}

// The definition (kind, inputs) a pin points at: the draft, or one released version.
const definitionOf = (query, pin) =>
  [...(query?.versions ?? []), ...(query?.drafts ?? [])].find((version) => version.id === pin);

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);
const versionLabel = (version) =>
  [version.name, version.environment && capitalize(version.environment.name), version.isReleased && 'Released']
    .filter(Boolean)
    .join(' · ');

export function Library({ options = {}, optionsChanged, darkMode }) {
  const [queries, setQueries] = useState(null); // null while loading
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const catalog = await libraryQueryService.getCatalog();
        if (cancelled) return;
        setQueries(catalog?.queries ?? []);
      } catch {
        if (!cancelled) setLoadFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const query = queries?.find((q) => q.id === options.libraryQueryId);
  const pin = options.libraryQueryVersionId;
  const isDraft = query?.drafts?.some((draft) => draft.id === pin);
  const definition = definitionOf(query, pin);
  const released = query?.versions?.find((version) => version.id === query.releasedVersionId);
  const showReleasedBadge = !!released && !isDraft && !!definition && released.id !== pin;

  const groupedQueries = useMemo(() => groupByFolder(queries ?? []), [queries]);
  const queryOptions = groupedQueries.flatMap((group) => group.options);
  const versionOptions = [
    ...(query?.versions ?? []).map((version) => ({ value: version.id, label: versionLabel(version) })),
    ...(query?.drafts ?? []).map((draft) => ({ value: draft.id, label: `${draft.name} · ${DRAFT_LABEL}` })),
  ];

  // `@/_ui/Select` calls onChange with the option's value (not the option object).
  const select = (nextQuery, nextPin) => {
    const next = definitionOf(nextQuery, nextPin);
    if (!next) return;
    const inputs = Object.fromEntries((next.inputs ?? []).map(({ name }) => [name, options.inputs?.[name] ?? '']));
    optionsChanged({
      ...options,
      libraryQueryId: nextQuery.id,
      libraryQueryVersionId: nextPin,
      libraryKind: next.kind,
      inputs,
    });
  };

  const pickQuery = (queryId) => {
    const next = queries.find((q) => q.id === queryId);
    select(next, (next?.versions?.find((v) => v.isReleased) ?? next?.versions?.[0] ?? next?.drafts?.[0])?.id);
  };

  const setInput = (name, value) =>
    optionsChanged({ ...options, inputs: { ...(options.inputs ?? {}), [name]: value } });

  if (loadFailed) {
    return (
      <div className="tw-font-body-default tw-text-text-placeholder" data-cy="library-query-editor">
        Couldn&apos;t load the query library
      </div>
    );
  }

  if (queries && queries.length === 0) {
    return (
      <div className="tw-font-body-default tw-text-text-placeholder" data-cy="library-query-editor">
        No queries in the query library yet
      </div>
    );
  }

  return (
    <div className="tw-flex tw-flex-col tw-gap-2" data-cy="library-query-editor">
      <div className="tw-flex tw-items-center tw-gap-2">
        <label className="form-label tw-mb-0 tw-w-[120px]">Query</label>
        <div className="tw-flex-1">
          <Select
            options={groupedQueries}
            value={queryOptions.find((option) => option.value === options.libraryQueryId)}
            onChange={pickQuery}
            placeholder="Select a query"
            isLoading={queries === null}
            darkMode={darkMode}
          />
        </div>
        {queries && (
          <a href={queryLibraryUrl()} target="_blank" rel="noreferrer">
            Open in library
          </a>
        )}
      </div>

      {query && (
        <div className="tw-flex tw-items-center tw-gap-2">
          <label className="form-label tw-mb-0 tw-w-[120px]">Version</label>
          <div className="tw-flex-1">
            <Select
              options={versionOptions}
              value={versionOptions.find((option) => option.value === pin)}
              onChange={(nextPin) => select(query, nextPin)}
              darkMode={darkMode}
            />
          </div>
          {showReleasedBadge && (
            <button
              type="button"
              className="tw-font-body-small tw-text-text-accent tw-bg-transparent tw-border-0 tw-p-0"
              onClick={() => select(query, released.id)}
              data-cy="library-newer-version"
            >
              {`${released.name} released`}
            </button>
          )}
        </div>
      )}

      {query && isDraft && (
        <div className="tw-font-body-small tw-text-text-placeholder" data-cy="library-draft-notice">
          This app can&apos;t be released while this query uses the draft.
        </div>
      )}

      {(definition?.inputs ?? []).map((input) => (
        <div key={input.name} className="tw-flex tw-items-center tw-gap-2">
          <label className="form-label tw-mb-0 tw-w-[120px]">{input.name}</label>
          <div className="tw-flex-1">
            <CodeHinter
              type="basic"
              initialValue={options.inputs?.[input.name] ?? ''}
              onChange={(value) => setInput(input.name, value)}
              placeholder={input.defaultValue ? `Default: ${input.defaultValue}` : ''}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

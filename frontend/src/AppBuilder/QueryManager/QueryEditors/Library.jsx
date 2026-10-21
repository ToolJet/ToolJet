import React, { useEffect, useMemo, useState } from 'react';
import Select from '@/_ui/Select';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { appsService, dataqueryService } from '@/_services';
import { getWorkspaceId } from '@/_helpers/utils';

const UNUSABLE_KINDS = ['runpy', 'workflows', 'library'];

export function Library({ options = {}, optionsChanged, darkMode }) {
  const [libraries, setLibraries] = useState([]);
  const [libraryQueries, setLibraryQueries] = useState([]);

  // The listing is paginated server-side (9 per page); page through all of it, same as the module picker.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const all = [];
      let page = 1;
      let totalPages = 1;
      while (page <= totalPages) {
        const data = await appsService.getAll(page, '', '', 'query_library', 'picker');
        all.push(...(data?.apps ?? []));
        const pageCount = Number(data?.meta?.total_pages);
        totalPages = Number.isFinite(pageCount) && pageCount > 0 ? pageCount : page;
        page += 1;
      }
      if (!cancelled) setLibraries(all);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const library = libraries.find((l) => l.id === options.libraryAppId);
  const libraryVersionId = library?.app_versions?.[0]?.id;

  useEffect(() => {
    setLibraryQueries([]);
    if (!libraryVersionId) return;
    let cancelled = false;
    dataqueryService.getAll(libraryVersionId).then(({ data_queries = [] }) => {
      if (!cancelled) setLibraryQueries(data_queries.filter((q) => !UNUSABLE_KINDS.includes(q.kind)));
    });
    return () => {
      cancelled = true;
    };
  }, [libraryVersionId]);

  const selectedQuery = libraryQueries.find((q) => q.id === options.libraryQueryId);
  const parameters = useMemo(() => selectedQuery?.options?.parameters ?? [], [selectedQuery]);

  // `@/_ui/Select` calls onChange with the option's value (not the option object).
  const pickLibrary = (libraryAppId) =>
    optionsChanged({ ...options, libraryAppId, libraryQueryId: undefined, libraryKind: undefined, inputs: {} });

  const pickQuery = (libraryQueryId) => {
    const query = libraryQueries.find((q) => q.id === libraryQueryId);
    const inputs = Object.fromEntries(
      (query?.options?.parameters ?? []).map((p) => [p.name, options.inputs?.[p.name] ?? ''])
    );
    optionsChanged({
      ...options,
      libraryQueryId,
      libraryKind: query?.kind,
      libraryVersion: 'latest',
      inputs,
    });
  };

  const setInput = (name, value) =>
    optionsChanged({ ...options, inputs: { ...(options.inputs ?? {}), [name]: value } });

  return (
    <div className="d-flex flex-column gap-2" data-cy="library-query-editor">
      <div className="d-flex align-items-center gap-2">
        <label className="form-label mb-0" style={{ width: 120 }}>
          Library
        </label>
        <div className="flex-grow-1">
          <Select
            options={libraries.map((l) => ({ value: l.id, label: l.name }))}
            value={options.libraryAppId}
            onChange={pickLibrary}
            placeholder="Select a library"
            darkMode={darkMode}
          />
        </div>
      </div>

      <div className="d-flex align-items-center gap-2">
        <label className="form-label mb-0" style={{ width: 120 }}>
          Query
        </label>
        <div className="flex-grow-1">
          <Select
            options={libraryQueries.map((q) => ({ value: q.id, label: q.name }))}
            value={options.libraryQueryId}
            onChange={pickQuery}
            placeholder="Select a query"
            isDisabled={!options.libraryAppId}
            darkMode={darkMode}
          />
        </div>
        {options.libraryAppId && (
          <a
            href={`/${getWorkspaceId()}/apps/${library?.slug ?? options.libraryAppId}`}
            target="_blank"
            rel="noreferrer"
          >
            Open in library
          </a>
        )}
      </div>

      <div className="d-flex align-items-center gap-2">
        <label className="form-label mb-0" style={{ width: 120 }}>
          Version
        </label>
        <span>Latest</span>
      </div>

      {parameters.map((parameter) => (
        <div key={parameter.name} className="d-flex align-items-center gap-2">
          <label className="form-label mb-0" style={{ width: 120 }}>
            {parameter.name}
          </label>
          <div className="flex-grow-1">
            <CodeHinter
              type="basic"
              initialValue={options.inputs?.[parameter.name] ?? ''}
              onChange={(value) => setInput(parameter.name, value)}
              placeholder={parameter.defaultValue ? `Default: ${parameter.defaultValue}` : ''}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

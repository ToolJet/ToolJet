import React, { useEffect, useState } from 'react';
import { AlertTriangle, Plus, Trash2 } from 'lucide-react';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { Button } from '@/components/ui/Rocket';
import { FieldRow, OptionCombobox } from './shared';
import useStore from '@/AppBuilder/_stores/store';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { isLinkedAppValid } from '@/AppBuilder/_stores/utils';

export function GotoApp({ getAllApps, event, handlerChanged, eventIndex, component }) {
  const { moduleId } = useModuleContext();
  const upsertLinkedApp = useStore((state) => state.upsertLinkedApp);
  const linkedAppsMap = useStore((state) => state.appStore.modules[moduleId]?.linkedApps);
  const [isLoading, setIsLoading] = useState(true);
  const [appOptions, setAppOptions] = useState([]);
  const queryParams = event.queryParams ?? [];

  const isValid = isLinkedAppValid(event.correlationId, linkedAppsMap);

  useEffect(() => {
    getAllApps()
      .then(setAppOptions)
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateQueryParams = (next) => handlerChanged(eventIndex, 'queryParams', next);

  const queryParamChangeHandler = (index, key, value) => {
    const next = queryParams.map((p, i) => (i === index ? [...p] : p));
    if (!next[index]) next[index] = ['', ''];
    next[index][key] = value;
    updateQueryParams(next);
  };

  const addQueryParam = () => updateQueryParams([...queryParams, ['', '']]);
  const deleteQueryParam = (index) => updateQueryParams(queryParams.filter((_, i) => i !== index));

  return (
    <div className="tw-flex tw-flex-col tw-gap-3" data-cy="go-to-app-panel">
      <FieldRow label="App" dataCy="go-to-app-label">
        <div className="tw-flex tw-flex-col tw-gap-1 tw-min-w-0 tw-flex-1">
          <OptionCombobox
            options={appOptions}
            value={event.correlationId}
            onChange={(value) => {
              const selected = appOptions.find((opt) => opt.value === value);

              // Persist only the stable id; drop the legacy `slug` key.
              handlerChanged(eventIndex, { correlationId: value, slug: undefined });

              // Mirror both `slug` and `currentVersionId` into the store so click-time URL
              // building works without a reload AND the validator can distinguish "missing target" from "no released version".
              upsertLinkedApp(
                value,
                { slug: selected.slug ?? null, currentVersionId: selected.currentVersionId ?? null },
                moduleId
              );
            }}
            placeholder={isLoading ? 'Loading…' : undefined}
            invalid={!isValid}
            errLabel="Undefined app"
          />
          {!isValid && (
            <div className="tw-flex tw-items-center tw-gap-1">
              <AlertTriangle className="tw-h-[12px] tw-w-[12px] tw-shrink-0 tw-text-[var(--icon-danger)]" />
              <span className="tw-font-['IBM_Plex_Sans'] tw-text-[11px]/[16px] tw-font-[400] tw-text-[var(--text-danger)]">{`App ${event.correlationId} undefined. Check if the linked app exists and has a released version.`}</span>
            </div>
          )}
        </div>
      </FieldRow>

      <div className="tw-flex tw-flex-col tw-gap-2">
        <span className="tw-font-body-default tw-text-text-default">Query params</span>
        {queryParams.map((param, index) => (
          <div key={index} className="tw-flex tw-items-center tw-gap-1.5">
            <div className="tw-min-w-0 tw-flex-1">
              <CodeHinter
                type="basic"
                initialValue={param?.[0]}
                onChange={(value) => queryParamChangeHandler(index, 0, value)}
                usePortalEditor={false}
                component={component}
                cyLabel="event-query-param-key"
              />
            </div>
            <div className="tw-min-w-0 tw-flex-1">
              <CodeHinter
                type="basic"
                initialValue={param?.[1]}
                onChange={(value) => queryParamChangeHandler(index, 1, value)}
                usePortalEditor={false}
                component={component}
                cyLabel="event-query-param-value"
              />
            </div>
            <Button
              variant="ghost"
              size="small"
              iconOnly
              leadingVisual={<Trash2 className="tw-h-2.5 tw-w-2.5 tw-text-icon-strong" />}
              onClick={() => deleteQueryParam(index)}
              aria-label="Remove query param"
            />
          </div>
        ))}
        <Button
          variant="outline"
          size="small"
          leadingVisual={<Plus className="tw-h-2.5 tw-w-2.5" />}
          onClick={addQueryParam}
          data-cy="button-add-query-param"
        >
          Add param
        </Button>
      </div>
    </div>
  );
}

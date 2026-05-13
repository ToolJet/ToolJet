import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { Button } from '@/components/ui/Rocket';
import { FieldRow, OptionCombobox } from './shared';

export function SwitchPage({ getPages, event, handlerChanged, eventIndex, component }) {
  const { t } = useTranslation();
  const pageOptions = getPages();
  const queryParams = event.queryParams ?? [];

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
    <div className="tw-flex tw-flex-col tw-gap-3" data-cy="switch-page-label-and-input">
      <FieldRow label={t('globals.page', 'Page')} dataCy="switch-page-label">
        <OptionCombobox
          options={pageOptions}
          value={event.pageId}
          onChange={(value) => handlerChanged(eventIndex, 'pageId', value)}
        />
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

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { Button, Combobox, ComboboxInput, ComboboxList, ComboboxItem, ComboboxEmpty } from '@/components/ui/Rocket';
import { FieldRow, ComboboxContent } from './shared';

export function SwitchPage({ getPages, event, handlerChanged, eventIndex, component }) {
  const { t } = useTranslation();
  const pageOptions = getPages();
  const selectedPage = pageOptions.find((o) => o.value === event.pageId) ?? null;
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
    <div className="tw-flex tw-flex-col tw-gap-[15px]" data-cy="switch-page-label-and-input">
      <FieldRow label={t('globals.page', 'Page')} dataCy="switch-page-label">
        <Combobox
          items={pageOptions}
          itemToStringLabel={(item) => item?.name ?? ''}
          value={selectedPage}
          onValueChange={(item) => handlerChanged(eventIndex, 'pageId', item?.value ?? null)}
        >
          <ComboboxInput placeholder={t('globals.select', 'Select') + '...'} />
          <ComboboxContent>
            <ComboboxList>
              {(item) => (
                <ComboboxItem key={item.value} value={item}>
                  {item.name}
                </ComboboxItem>
              )}
            </ComboboxList>
            <ComboboxEmpty>{t('globals.noResultsFound', 'No results found.')}</ComboboxEmpty>
          </ComboboxContent>
        </Combobox>
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

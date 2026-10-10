import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Checkbox, Input } from '@/components/ui/Rocket';
import { toDataCy } from './filterTemplates';

export default function FilterGroup({
  title,
  searchPlaceholder,
  options,
  selected,
  counts,
  onToggle,
  dataCySuffix,
  rowDataCy,
  noMatchText,
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const visible = options.filter((option) => option.label.toLowerCase().includes(search.trim().toLowerCase()));
  const noMatches = !!search.trim() && !visible.length;

  return (
    <section className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-gap-3">
      <h4 className="tw-m-0 tw-font-title-default tw-text-text-default">{title}</h4>
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={searchPlaceholder}
        aria-label={searchPlaceholder}
      />
      {noMatches && (
        <div
          className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-items-center tw-justify-center tw-gap-0 tw-text-center"
          data-cy={`${dataCySuffix}-no-match`}
        >
          <span className="tw-font-body-large tw-text-text-default">{noMatchText(search.trim())}</span>
          <Button
            variant="ghostBrand"
            size="medium"
            onClick={() => setSearch('')}
            data-cy={`${dataCySuffix}-clear-search`}
          >
            {t('homePage.templateLibraryModal.clearSearch', 'Clear search')}
          </Button>
        </div>
      )}
      {!noMatches && (
        <ul className="tw-m-0 tw-flex tw-min-h-0 tw-flex-col tw-gap-1 tw-overflow-y-auto tw-p-0 tw-pr-3 [scrollbar-gutter:stable]">
          {visible.map((option) => {
            const count = counts[option.id] ?? 0;
            const id = `template-filter-${dataCySuffix}-${option.id}`;
            return (
              <li
                key={option.id}
                className={`tw-flex tw-list-none tw-items-center tw-gap-2 tw-py-1 ${count ? '' : 'tw-opacity-50'}`}
                data-cy={`${toDataCy(option.label)}-${rowDataCy}`}
              >
                <Checkbox
                  id={id}
                  checked={selected.has(option.id)}
                  onCheckedChange={(checked) => onToggle(option.id, checked === true)}
                />
                <label
                  htmlFor={id}
                  className="tw-flex-1 tw-cursor-pointer tw-font-body-default tw-text-text-default"
                  data-cy={`${toDataCy(option.label)}-${dataCySuffix}-title`}
                >
                  {option.label}
                </label>
                <span
                  className="tw-font-body-default tw-text-text-placeholder"
                  data-cy={`${toDataCy(option.label)}-${dataCySuffix}-count`}
                >
                  {count}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

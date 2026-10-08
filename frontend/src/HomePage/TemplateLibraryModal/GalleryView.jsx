import React, { forwardRef, useEffect, useMemo, useState } from 'react';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Input,
  Skeleton,
} from '@/components/ui/Rocket';
import TemplateCard from './TemplateCard';
import FilterGroup from './FilterGroup';
import { categoryOptions, facetCounts, filterTemplates, sourceOptions } from './filterTemplates';
import { trackTemplateEvent } from './analytics';

const SKELETON_CARD_COUNT = 6;

const toggle = (set, id, checked) => {
  const next = new Set(set);
  checked ? next.add(id) : next.delete(id);
  return next;
};

const GalleryView = forwardRef(function GalleryView(
  { templates, loadStatus, onRetry, categoryTitles, onOpen },
  scrollRef
) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState(new Set());
  const [sources, setSources] = useState(new Set());

  const filters = { query, categories, sources };
  const visible = useMemo(() => filterTemplates(templates, filters), [templates, query, categories, sources]); // eslint-disable-line react-hooks/exhaustive-deps
  const counts = useMemo(() => facetCounts(templates, filters), [templates, query, categories, sources]); // eslint-disable-line react-hooks/exhaustive-deps
  const categoryList = useMemo(() => categoryOptions(templates, categoryTitles ?? {}), [templates, categoryTitles]);
  const sourceList = useMemo(() => sourceOptions(templates), [templates]);
  // Colour follows a template's place in the full catalog, so it does not change as filters narrow the grid
  const colorIndexById = useMemo(() => new Map(templates.map((template, index) => [template.id, index])), [templates]);

  // One event per pause in typing; the query text is never sent
  const trackSearch = useMemo(
    () =>
      _.debounce((length, resultCount) => {
        if (length) trackTemplateEvent('template_search', { query_length: length, result_count: resultCount });
      }, 500),
    []
  );
  useEffect(() => () => trackSearch.cancel(), [trackSearch]);
  useEffect(() => {
    trackSearch(query.trim().length, visible.length);
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  // The search text counts as one filter because Clear filters resets it too
  const appliedFilterCount = categories.size + sources.size + (query.trim() ? 1 : 0);

  const clearFilters = () => {
    setQuery('');
    setCategories(new Set());
    setSources(new Set());
  };

  return (
    <div className="tw-flex tw-h-full">
      <aside className="tw-flex tw-w-[300px] tw-shrink-0 tw-flex-col tw-gap-6 tw-border-0 tw-border-r tw-border-solid tw-border-border-weak tw-p-6">
        <FilterGroup
          title={t('homePage.templateLibraryModal.category', 'Category')}
          searchPlaceholder={t('homePage.templateLibraryModal.searchCategories', 'Search categories')}
          options={categoryList}
          selected={categories}
          counts={counts.category}
          dataCySuffix="category"
          rowDataCy="list-item"
          onToggle={(id, checked) => {
            trackTemplateEvent('click_template_category', { template_category_id: id, checked });
            setCategories((current) => toggle(current, id, checked));
          }}
        />
        <FilterGroup
          title={t('homePage.templateLibraryModal.dataSource', 'Data source')}
          searchPlaceholder={t('homePage.templateLibraryModal.searchDataSources', 'Search data sources')}
          options={sourceList}
          selected={sources}
          counts={counts.source}
          dataCySuffix="data-source"
          rowDataCy="source-list-item"
          onToggle={(id, checked) => {
            trackTemplateEvent('template_filter_data_source', { data_source_id: id, checked });
            setSources((current) => toggle(current, id, checked));
          }}
        />
      </aside>
      <div ref={scrollRef} className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-6 tw-overflow-y-auto tw-p-6">
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-4">
          <Input
            className="tw-max-w-[420px]"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('homePage.templateLibraryModal.searchTemplates', 'Search templates')}
            aria-label={t('homePage.templateLibraryModal.searchTemplates', 'Search templates')}
            data-cy="search-input-field"
          />
          {loadStatus === 'loaded' && (
            <div className="tw-flex tw-items-center tw-gap-2">
              <span className="tw-font-body-large tw-text-text-placeholder" data-cy="templates-count">
                {t('homePage.templateLibraryModal.templateCount', {
                  count: visible.length,
                  defaultValue_one: '{{count}} template',
                  defaultValue_other: '{{count}} templates',
                })}
              </span>
              {appliedFilterCount > 0 && (
                <>
                  <span aria-hidden="true" className="tw-text-text-placeholder">
                    •
                  </span>
                  <Button variant="ghostBrand" size="medium" onClick={clearFilters} data-cy="clear-filters-link">
                    {t('homePage.templateLibraryModal.clearFiltersCount', {
                      count: appliedFilterCount,
                      defaultValue: 'Clear filters ({{count}})',
                    })}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
        {loadStatus === 'loading' && (
          <div
            className="tw-grid tw-grid-cols-1 tw-gap-6 md:tw-grid-cols-2 xl:tw-grid-cols-3"
            data-cy="templates-loading"
          >
            {Array.from({ length: SKELETON_CARD_COUNT }, (__, i) => (
              <Skeleton key={i} className="tw-aspect-[4/3] tw-w-full" />
            ))}
          </div>
        )}
        {loadStatus === 'error' && (
          <Empty data-cy="templates-error-state">
            <EmptyHeader>
              <EmptyTitle>{t('homePage.templateLibraryModal.loadError', 'Could not load templates')}</EmptyTitle>
              <EmptyDescription>
                {t('homePage.templateLibraryModal.loadErrorHint', 'Check your connection and try again.')}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" onClick={onRetry} data-cy="retry-load-templates">
                {t('homePage.templateLibraryModal.retry', 'Retry')}
              </Button>
            </EmptyContent>
          </Empty>
        )}
        {loadStatus === 'loaded' &&
          (visible.length ? (
            <div className="tw-grid tw-grid-cols-1 tw-gap-6 md:tw-grid-cols-2 xl:tw-grid-cols-3">
              {visible.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  colorIndex={colorIndexById.get(template.id)}
                  onOpen={onOpen}
                />
              ))}
            </div>
          ) : (
            <Empty data-cy="templates-empty-state">
              <EmptyHeader>
                <EmptyTitle>{t('homePage.templateLibraryModal.noResults', 'No templates match')}</EmptyTitle>
                <EmptyDescription>
                  {t('homePage.templateLibraryModal.noResultsHint', 'Try another search or clear the filters.')}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button variant="outline" onClick={clearFilters} data-cy="clear-template-filters">
                  {t('homePage.templateLibraryModal.clearFilters', 'Clear filters')}
                </Button>
              </EmptyContent>
            </Empty>
          ))}
      </div>
    </div>
  );
});

export default GalleryView;

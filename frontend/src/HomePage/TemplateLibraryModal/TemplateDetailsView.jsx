import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Skeleton,
} from '@/components/ui/Rocket';
import { getSvgIcon } from '@/_helpers/appUtils';
import { trackTemplateEvent } from './analytics';
import { toDataCy } from './filterTemplates';

export function TemplateBreadcrumb({ template, onBack }) {
  const { t } = useTranslation();
  return (
    <Breadcrumb className="tw-min-w-0">
      <BreadcrumbList className="tw-m-0 tw-flex-nowrap tw-gap-3 tw-p-0">
        <BreadcrumbItem>
          <BreadcrumbLink asChild className="tw-text-text-default hover:tw-text-text-default">
            <button
              type="button"
              onClick={onBack}
              className="tw-flex tw-cursor-pointer tw-items-center tw-gap-2 tw-border-0 tw-bg-transparent tw-p-0 tw-font-title-default"
              data-cy="all-templates-breadcrumb"
            >
              <ArrowLeft className="tw-size-5 tw-text-icon-default" />
              {t('homePage.templateLibraryModal.allTemplates', 'All templates')}
            </button>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="tw-font-title-default tw-text-text-placeholder">/</BreadcrumbSeparator>
        <BreadcrumbItem className="tw-min-w-0">
          <BreadcrumbPage className="tw-truncate tw-font-title-heavy-x-large">{template.name}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default function TemplateDetailsView({ template, categoryTitle, darkMode, onCreate, createDisabled }) {
  const { t } = useTranslation();
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const iframeRef = useRef(null);

  // Clicks inside an iframe never reach this document; focus moving into the iframe does (window blur)
  useEffect(() => {
    const onBlur = () => {
      if (document.activeElement !== iframeRef.current) return;
      trackTemplateEvent('template_preview_interact', { template_name: template.name });
      window.removeEventListener('blur', onBlur);
    };
    window.addEventListener('blur', onBlur);
    return () => window.removeEventListener('blur', onBlur);
  }, [template.name]);

  return (
    <div className="tw-flex tw-h-full tw-min-h-0">
      <div className="tw-relative tw-min-w-0 tw-flex-1 tw-p-4" data-cy="template-image">
        {!previewLoaded && <Skeleton className="tw-absolute tw-inset-4" />}
        {/* No sandbox: the preview builds a nested srcdoc iframe through contentDocument, which a sandbox blocks. Content is same-origin repo assets. */}
        <iframe
          ref={iframeRef}
          key={`${template.id}-${darkMode}`}
          src={`assets/custom-components/templates/${template.id}.html${darkMode ? '?theme=dark' : ''}`}
          title={`${template.name} preview`}
          onLoad={() => setPreviewLoaded(true)}
          className="tw-h-full tw-w-full tw-rounded-lg tw-border-0"
        />
      </div>
      <aside className="tw-flex tw-w-[360px] tw-shrink-0 tw-flex-col tw-gap-6 tw-overflow-y-auto tw-border-0 tw-border-l tw-border-solid tw-border-border-weak tw-p-6">
        <span className="tw-self-start tw-rounded tw-bg-interactive-hover tw-px-2 tw-py-1 tw-font-body-small tw-text-text-default">
          {categoryTitle}
        </span>
        <div className="tw-flex tw-flex-col tw-gap-2">
          <h3 className="tw-m-0 tw-font-title-x-large tw-text-text-default" data-cy={toDataCy(template.name)}>
            {template.name}
          </h3>
          <p className="tw-m-0 tw-font-body-large tw-text-text-placeholder" data-cy="description-text">
            {template.description}
          </p>
        </div>
        {!!template.sources?.length && (
          <section className="tw-flex tw-flex-col tw-gap-2">
            <h4 className="tw-m-0 tw-font-title-default tw-text-text-default">
              {t('homePage.templateLibraryModal.dataSources', 'Data sources')}
            </h4>
            <div className="tw-flex tw-flex-wrap tw-gap-2">
              {template.sources.map((source) => (
                <span
                  key={source.id}
                  className="tw-flex tw-items-center tw-gap-2 tw-rounded tw-bg-interactive-hover tw-px-2 tw-py-1 tw-font-body-default tw-text-text-default"
                  data-cy={`${toDataCy(source.name)}-template-source-name`}
                >
                  {getSvgIcon(source.id, 16, 16)}
                  {source.name}
                </span>
              ))}
            </div>
          </section>
        )}
        {!!template.features?.length && (
          <section className="tw-flex tw-flex-col tw-gap-2">
            <h4 className="tw-m-0 tw-font-title-default tw-text-text-default">
              {t('homePage.templateLibraryModal.features', 'Features')}
            </h4>
            <ul className="tw-m-0 tw-flex tw-flex-col tw-gap-1 tw-pl-5 tw-font-body-default tw-text-text-default">
              {template.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </section>
        )}
        <Button
          className="tw-mt-auto tw-w-full"
          onClick={onCreate}
          disabled={createDisabled}
          data-cy="create-application-from-template-button"
        >
          {t('homePage.templateLibraryModal.createAppfromTemplate', 'Create application from template')}
          <ArrowRight className="tw-size-4" />
        </Button>
      </aside>
    </div>
  );
}

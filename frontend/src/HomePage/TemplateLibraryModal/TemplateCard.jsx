import React from 'react';
import { toDataCy } from './filterTemplates';

export default function TemplateCard({ template, darkMode, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(template)}
      className="tw-flex tw-flex-col tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-border-weak tw-bg-background-surface-layer-01 tw-p-0 tw-text-left hover:tw-shadow-elevation-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-border-accent-strong"
      data-cy={`${toDataCy(template.id)}-list-item`}
    >
      <img
        src={`assets/custom-components/templates/${template.id}${darkMode ? '-dark' : ''}.svg`}
        alt=""
        loading="lazy"
        className="tw-aspect-[16/10] tw-w-full tw-object-cover tw-object-top"
      />
      <div className="tw-flex tw-flex-col tw-gap-1 tw-p-4">
        <span className="tw-font-title-default tw-text-text-default">{template.name}</span>
        <span className="tw-line-clamp-2 tw-font-body-default tw-text-text-placeholder">{template.description}</span>
      </div>
    </button>
  );
}

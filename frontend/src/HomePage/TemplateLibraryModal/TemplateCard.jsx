import React from 'react';
import { categoryIcon, iconColor } from './templateIcons';
import { toDataCy } from './filterTemplates';

export default function TemplateCard({ template, colorIndex, onOpen }) {
  const Icon = categoryIcon(template.category);
  return (
    <button
      type="button"
      onClick={() => onOpen(template)}
      className="tw-flex tw-h-full tw-flex-col tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-border-weak tw-bg-background-surface-layer-01 tw-p-4 tw-text-left hover:tw-shadow-elevation-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-border-accent-strong"
      data-cy={`${toDataCy(template.id)}-list-item`}
    >
      <Icon className="tw-size-6" style={{ color: iconColor(colorIndex) }} aria-hidden="true" />
      <div className="tw-flex tw-flex-col tw-gap-1">
        <span className="tw-font-title-x-large tw-text-text-default">{template.name}</span>
        <span className="tw-line-clamp-2 tw-font-body-large tw-text-text-placeholder">{template.description}</span>
      </div>
    </button>
  );
}

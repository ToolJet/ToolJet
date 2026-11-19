import React, { type ReactNode } from 'react';

type SectionHeaderProps = {
  title: string;
  /** One line under the title; "Learn more" follows it when `docsHref` is set. */
  description?: string;
  docsHref?: string;
  /** Right side: an "Add column" button, for example. */
  action?: ReactNode;
  'data-cy'?: string;
};

export function SectionHeader({ title, description, docsHref, action, 'data-cy': dataCy }: SectionHeaderProps) {
  return (
    <div className="tw-flex tw-items-start tw-gap-4">
      <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-1">
        <h3 className="tw-m-0 tw-whitespace-nowrap tw-font-title-large tw-text-text-default" data-cy={dataCy}>
          {title}
        </h3>
        {(description || docsHref) && (
          <p className="tw-m-0 tw-font-body-default tw-text-text-placeholder">
            {description}
            {description && docsHref && ' '}
            {docsHref && (
              <a
                href={docsHref}
                target="_blank"
                rel="noreferrer"
                className="tw-font-title-default tw-text-text-placeholder hover:tw-underline"
              >
                Learn more
              </a>
            )}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

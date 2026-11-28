import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Rocket';

const DOCS_URL = 'https://docs.tooljet.com/docs/security/constants/';

const LEGEND = [
  { label: 'Secrets', hint: 'Masked. Data sources and queries only' },
  { label: 'Global', hint: 'Plain. Use anywhere' },
];

// `onCreate` is optional: callers that cannot create constants leave it out and the button is not rendered.
export default function ConstantsPageHeader({ onCreate }: { onCreate?: () => void }) {
  return (
    <div className="tw-flex tw-items-center tw-justify-between tw-gap-4">
      <div className="tw-flex tw-flex-col tw-items-start tw-gap-2">
        <div className="tw-flex tw-flex-col">
          {/* 22px has no typography token and font-title-xx-large pins a 32px line-height, so the type is composed here */}
          <h1 className="tw-m-0 tw-font-inter tw-font-medium tw-text-[22px] tw-leading-[1.6] tw-tracking-[var(--letter-spacing-display-medium)] tw-text-text-medium">
            Workspace constants
          </h1>
          <p className="tw-m-0 tw-font-body-default tw-text-text-placeholder">
            Keep reusable values in one place and use them across all other resources.{' '}
            <a
              href={DOCS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="tw-text-text-brand tw-underline hover:tw-text-text-brand"
            >
              Learn more
            </a>
          </p>
        </div>
        <div className="tw-flex tw-items-center tw-gap-[7px] tw-rounded-lg tw-bg-background-surface-layer-02 tw-px-2.5 tw-py-1">
          {LEGEND.map(({ label, hint }, i) => (
            <React.Fragment key={label}>
              {i > 0 && (
                <span aria-hidden="true" className="tw-font-body-default tw-text-text-placeholder">
                  |
                </span>
              )}
              <span className="tw-font-title-default tw-text-text-default">{label}</span>
              <span className="tw-font-body-default tw-text-text-placeholder">{hint}</span>
            </React.Fragment>
          ))}
        </div>
      </div>
      {onCreate && (
        <Button
          variant="outline"
          className="tw-border-border-accent-weak"
          leadingVisual={<Plus size={16} />}
          onClick={onCreate}
        >
          Create constant
        </Button>
      )}
    </div>
  );
}

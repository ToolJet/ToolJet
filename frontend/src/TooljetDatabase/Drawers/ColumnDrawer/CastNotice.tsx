import React from 'react';
import { CircleCheck, Loader2, TriangleAlert } from 'lucide-react';
import { InlineInfo } from '@/components/ui/Rocket/InlineInfo/InlineInfo';
import type { CastReport } from './useCastReport';

type CastNoticeProps = {
  report: CastReport | null;
  /** Narrows the table to the rows the check counted, and closes the drawer. */
  onShowRows: () => void;
};

// What changing the type will do to the values already in the column: counted in advance where that is possible.
export function CastNotice({ report, onShowRows }: CastNoticeProps) {
  if (!report) return null;

  if (report.status === 'loading') {
    return (
      <InlineInfo
        variant="filled"
        className="tw-mt-1.5"
        icon={<Loader2 className="tw-animate-spin" size={18} />}
        description="Checking existing values…"
        data-cy="cast-report-loading"
      />
    );
  }
  if (report.status === 'uncheckable') {
    return (
      <InlineInfo
        variant="filled"
        className="tw-mt-1.5"
        description="Existing values can’t be checked in advance for this conversion. Rows that aren’t valid will stop the migration."
        data-cy="cast-report-uncheckable"
      />
    );
  }
  if (report.status === 'error') {
    return (
      <InlineInfo
        variant="filled"
        className="tw-mt-1.5"
        description={`Couldn’t check existing values: ${report.message}`}
        data-cy="cast-report-error"
      />
    );
  }
  if (report.count === 0) {
    return (
      <InlineInfo
        variant="filled"
        className="tw-mt-1.5"
        icon={<CircleCheck size={18} />}
        description="Every value in this environment converts cleanly. Other environments are checked when you switch to them."
        data-cy="cast-report-clean"
      />
    );
  }
  const isRegex = report.probe.kind === 'regex';
  return (
    <div
      className="tw-mt-1 tw-flex tw-items-start tw-gap-1 tw-font-body-small tw-text-text-danger"
      data-cy={isRegex ? 'cast-report-bad-values' : 'cast-report-bad-values-range'}
    >
      <TriangleAlert className="tw-mt-px tw-size-3.5 tw-shrink-0 tw-text-icon-danger" aria-hidden />
      <span>
        {report.count} value(s) in this column can’t be converted
        {isRegex ? (
          <>
            .{' '}
            <button
              type="button"
              className="tw-cursor-pointer tw-border-0 tw-bg-transparent tw-p-0 tw-text-inherit tw-underline"
              onClick={onShowRows}
              data-cy="cast-report-show-rows"
            >
              Show rows
            </button>
          </>
        ) : (
          ' — they’re outside integer’s range.'
        )}
      </span>
    </div>
  );
}

import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { OptionValue } from '../FilterChip';
import { FIELD_CLASS, ROW_CLASS, RowConnector, RowCloseButton } from './filterRowParts';

const READ_ONLY_CLASS = cn(FIELD_CLASS, 'tw-truncate tw-bg-background-surface-layer-02');

const Switch = ({ checked, label, dataCy, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    data-cy={dataCy}
    onClick={() => onChange(!checked)}
    className={cn(
      'tw-relative tw-h-5 tw-w-9 tw-shrink-0 tw-rounded-full tw-border-0 tw-p-0 tw-transition-colors',
      checked ? 'tw-bg-[var(--cc-primary-brand)]' : 'tw-bg-background-surface-layer-03'
    )}
  >
    <span
      className={cn(
        'tw-absolute tw-top-0.5 tw-left-0.5 tw-h-4 tw-w-4 tw-rounded-full tw-bg-background-surface-layer-01 tw-shadow tw-transition-transform',
        checked && 'tw-translate-x-4'
      )}
    />
  </button>
);

/**
 * A filter the builder saved, as a row of the filters panel: column and operator are plain text, only the value
 * can be edited. The cross clears the value and keeps the row; a filter with no value box is a switch.
 */
export const FilterQuickRow = memo(({ chip, index, connector, options, darkMode, onChange }) => {
  const label = `${chip.column} ${chip.operator}`;
  // something to clear: a value, or a filter that is switched on
  const canClear = chip.needsValue ? chip.value !== '' : chip.applied;

  return (
    <div className={ROW_CLASS} data-cy={`quick-filter-row-${index}`}>
      <RowConnector label={connector} dataCy={`quick-filter-connector-${index}`} />
      <div data-cy={`quick-filter-column-${index}`} className={READ_ONLY_CLASS}>
        {chip.column}
      </div>
      <div data-cy={`quick-filter-operator-${index}`} className={READ_ONLY_CLASS}>
        {chip.operator}
      </div>
      <div>
        {!chip.needsValue ? (
          <Switch
            checked={chip.applied}
            label={label}
            dataCy={`quick-filter-switch-${index}`}
            onChange={(applied) => onChange(chip, applied)}
          />
        ) : options ? (
          <div className={FIELD_CLASS}>
            <OptionValue
              chip={chip}
              label={label}
              options={options}
              darkMode={darkMode}
              dataCy={`quick-filter-value-${index}`}
              onChange={(value) => onChange(chip, value)}
            />
          </div>
        ) : (
          <div className={FIELD_CLASS}>
            <input
              type="text"
              data-cy={`quick-filter-value-${index}`}
              aria-label={`${label} value`}
              value={chip.value}
              placeholder="Enter text"
              // the global `input[type="text"]` rule paints any outline that is not "none"; the field border shows the focus
              style={{ outline: 'none' }}
              className="tw-h-9 tw-min-w-0 tw-flex-1 tw-border-0 tw-bg-transparent tw-p-0 tw-text-lg tw-text-text-default [font-family:inherit] placeholder:tw-text-text-placeholder"
              onChange={(event) => onChange(chip, event.target.value)}
            />
          </div>
        )}
      </div>
      {canClear ? (
        <RowCloseButton
          dataCy={`quick-filter-clear-${index}`}
          label={`Clear ${chip.column} filter`}
          onClick={() => onChange(chip, chip.needsValue ? '' : false)}
        />
      ) : (
        <span />
      )}
    </div>
  );
});

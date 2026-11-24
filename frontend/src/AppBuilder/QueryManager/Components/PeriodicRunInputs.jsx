import React from 'react';
import { useTranslation } from 'react-i18next';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { CustomToggleSwitch } from './CustomToggleSwitch';

// Revealed directly under the "Run this query periodically" toggle.
// When fx is active, shows the expression editor for the toggle value itself
// (stored as a string in options.runPeriodically). The time interval is in
// milliseconds and supports fx (resolved at runtime).
export default function PeriodicRunInputs({ options, darkMode, optionchanged }) {
  const { t } = useTranslation();
  const fxMode = !!options?.runPeriodicallyFx;
  const toggleOn = !fxMode && !!options?.runPeriodically;

  if (!fxMode && !toggleOn) return null;

  const fxValue = typeof options?.runPeriodically === 'string' ? options.runPeriodically : '';

  return (
    <div className="tw-flex tw-flex-col tw-gap-2 tw-mt-2 tw-mb-4">
      {fxMode && (
        <div data-param="runPeriodically" className="tw-w-full tw-max-w-[715px] tw-pl-8 tw-box-border">
          <CodeHinter
            type="basic"
            initialValue={fxValue}
            onChange={(value) => optionchanged('runPeriodically', value)}
            placeholder="{{}}"
            cyLabel="run-periodically-fx-expression"
          />
        </div>
      )}
      <div data-param="queryRunInterval" className="tw-flex tw-items-center tw-gap-[5px] tw-pl-[34px]">
        {/* form-label is the query manager's label style; ! beats its `.query-details .form-label` 100px width */}
        <label className="form-label tw-items-center !tw-w-[132px]" data-cy="label-time-interval-input">
          {t('editor.queryManager.timeInterval', 'Time interval ( ms )')}
        </label>
        <div className="tw-grow tw-max-w-[530px]">
          <CodeHinter
            type="basic"
            initialValue={options?.queryRunInterval ?? ''}
            onChange={(value) => optionchanged('queryRunInterval', value)}
            placeholder="60000"
            cyLabel="time-interval"
          />
        </div>
      </div>
      <div data-param="pauseAfterFailures" className="tw-flex tw-items-center tw-gap-[5px] tw-pl-[34px]">
        <label className="form-label tw-items-center !tw-w-[132px]" data-cy="label-pause-after-failures-input">
          {t('editor.queryManager.pauseAfterFailures', 'Pause after failures')}
        </label>
        <div className="tw-grow tw-max-w-[530px]">
          <CodeHinter
            type="basic"
            initialValue={options?.pauseAfterFailures ?? ''}
            onChange={(value) => optionchanged('pauseAfterFailures', value)}
            placeholder={t('editor.queryManager.pauseAfterFailuresPlaceholder', 'Never')}
            cyLabel="pause-after-failures"
          />
        </div>
      </div>
      <div data-param="runPeriodicallyInBackground" className="tw-pl-[34px]">
        <CustomToggleSwitch
          action="runPeriodicallyInBackground"
          dataCy="run-periodically-in-background"
          isChecked={!!options?.runPeriodicallyInBackground}
          toggleSwitchFunction={() =>
            optionchanged('runPeriodicallyInBackground', !options?.runPeriodicallyInBackground)
          }
          darkMode={darkMode}
          label={t('editor.queryManager.runInInactiveTabs', 'Keep running when the browser tab is inactive')}
        />
      </div>
    </div>
  );
}

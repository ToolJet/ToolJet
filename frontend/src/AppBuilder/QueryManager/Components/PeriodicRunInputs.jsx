import React from 'react';
import { useTranslation } from 'react-i18next';
import CodeHinter from '@/AppBuilder/CodeEditor';
import './PeriodicRunInputs.scss';

// Revealed directly under the "Run this query periodically" toggle.
// When fx is active, shows the expression editor for the toggle value itself
// (stored as a string in options.runPeriodically). The time interval is in
// milliseconds and supports fx (resolved + clamped to a safe minimum at runtime).
export default function PeriodicRunInputs({ options, optionchanged }) {
  const { t } = useTranslation();
  const fxMode = !!options?.runPeriodicallyFx;
  const toggleOn = !fxMode && !!options?.runPeriodically;

  if (!fxMode && !toggleOn) return null;

  const fxValue = typeof options?.runPeriodically === 'string' ? options.runPeriodically : '';

  return (
    <div className="periodic-run-inputs">
      {fxMode && (
        <div className="periodic-run-fx-input">
          <CodeHinter
            type="basic"
            initialValue={fxValue}
            onChange={(value) => optionchanged('runPeriodically', value)}
            placeholder="{{}}"
            cyLabel="run-periodically-fx-expression"
          />
        </div>
      )}
      <div className="periodic-run-interval-row">
        <label className="form-label align-items-center" data-cy="label-time-interval-input" style={{ width: 132 }}>
          {t('editor.queryManager.timeInterval', 'Time interval ( ms )')}
        </label>
        <div className="flex-grow-1" style={{ maxWidth: '530px' }}>
          <CodeHinter
            type="basic"
            initialValue={options?.queryRunInterval ?? ''}
            onChange={(value) => optionchanged('queryRunInterval', value)}
            placeholder="60000"
            cyLabel="time-interval"
          />
        </div>
      </div>
    </div>
  );
}

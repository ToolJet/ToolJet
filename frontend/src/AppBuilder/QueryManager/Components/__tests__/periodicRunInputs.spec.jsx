import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { seedApp } from '@/test/app-builder';
import { createAppBuilderControls } from '@/test/app-builder/controls';
import { resetAllStores } from '@/AppBuilder/_stores/utils';
import PeriodicRunInputs from '../PeriodicRunInputs';

// "Pause after failures" defaults to 0 (never pause) and says so under the field.
describe('Pause after failures input', () => {
  const controls = createAppBuilderControls();
  beforeEach(() => {
    controls.observers.install(); // CodeHinter observes its own size and visibility
    seedApp({});
  });
  afterEach(() => {
    controls.restore();
    resetAllStores();
  });

  const renderInputs = (options) =>
    render(
      // CodeHinter reads the route.
      <MemoryRouter>
        <PeriodicRunInputs options={{ runPeriodically: true, ...options }} optionchanged={jest.fn()} />
      </MemoryRouter>
    );
  const pauseField = () => document.querySelector('[data-cy="pause-after-failures-input-field"]');

  test('shows 0 when the query has no value saved, with the never-pause hint', () => {
    renderInputs({});

    expect(pauseField()).toHaveTextContent('0');
    expect(screen.getByText('Leave 0 or empty to never pause')).toBeInTheDocument();
  });

  test('shows a saved value as it is', () => {
    renderInputs({ pauseAfterFailures: '3' });

    expect(pauseField()).toHaveTextContent('3');
  });
});

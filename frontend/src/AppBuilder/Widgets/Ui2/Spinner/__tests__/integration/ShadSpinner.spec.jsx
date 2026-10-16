/**
 * UI 2.0 Spinner: a busy indicator (a ring or bouncing dots) with an optional label.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Spinner itself does. Titles carry [ShadSpinner-<AREA>-<NNN>] scenario ids.
 */
import { screen, waitFor } from '@testing-library/react';
import { createWidgetHarness, binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const widget = createWidgetHarness({
  componentType: 'ShadSpinner',
  handle: 'spinner1',
  id: 'spin1',
  widgetHeight: 40,
  widgetWidth: 240,
});

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const status = () => screen.getByRole('status');
const ring = () => status().querySelector('svg');

describe('UI 2.0 Spinner', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadSpinner-DEF-001] spins a 24px ring with its label to the right, announced as a status', async () => {
    render();

    await waitFor(() => expect(status()).toHaveAttribute('aria-label', 'Loading…'));
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(ring()).toHaveClass('animate-spin');
    expect(ring()).toHaveAttribute('width', '24');
    expect(status()).toHaveClass('flex-row');
  });

  test('[ShadSpinner-PROP-001] variant dots draws three bouncing dots instead of the ring', async () => {
    render({ properties: { variant: binding('dots') } });

    await waitFor(() => expect(status().querySelectorAll('.animate-bounce')).toHaveLength(3));
    expect(ring()).toBeNull();
  });

  test('[ShadSpinner-PROP-002] size takes sm, default, lg or a number of pixels', async () => {
    render({ properties: { size: binding('lg') } });
    await waitFor(() => expect(ring()).toHaveAttribute('width', '32'));

    render({ properties: { size: binding('sm') } });
    await waitFor(() => expect(ring()).toHaveAttribute('width', '16'));

    render({ properties: { size: binding('{{48}}') } });
    await waitFor(() => expect(ring()).toHaveAttribute('width', '48'));
  });

  test('[ShadSpinner-PROP-003] label names the status, and without one it is announced as Loading', async () => {
    render({ properties: { label: binding('Syncing orders') } });
    await waitFor(() => expect(status()).toHaveAttribute('aria-label', 'Syncing orders'));
    expect(screen.getByText('Syncing orders')).toBeInTheDocument();

    render({ properties: { label: binding('') } });
    await waitFor(() => expect(status()).toHaveAttribute('aria-label', 'Loading'));
    expect(status().textContent).toBe('');
  });

  test('[ShadSpinner-PROP-004] labelPosition bottom puts the label under the indicator', async () => {
    render({ properties: { labelPosition: binding('bottom') } });

    await waitFor(() => expect(status()).toHaveClass('flex-col'));
  });

  test('[ShadSpinner-STY-001] spinner, track and label colours and the alignment reach the spinner', async () => {
    const { container } = render({
      styles: {
        spinnerColor: binding('#7c3aed'),
        trackColor: binding('#ede9fe'),
        labelColor: binding('#4c1d95'),
        alignment: binding('center'),
      },
    });

    await waitFor(() => expect(status()).toBeInTheDocument());
    const root = container.querySelector('.tj-shadcn');
    expect(root.style.getPropertyValue('--sc-primary')).toBe('#7c3aed');
    expect(root.style.getPropertyValue('--lk-track')).toBe('#ede9fe');
    expect(root.style.getPropertyValue('--lk-label')).toBe('#4c1d95');
    expect(status().parentElement).toHaveClass('justify-center');
  });
});

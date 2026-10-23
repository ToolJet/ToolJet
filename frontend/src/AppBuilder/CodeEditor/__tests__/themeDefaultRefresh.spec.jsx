import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
/**
 * A blank UI 2.0 style field read the theme's value when it first drew (and one frame later), then kept it: with the
 * field still open, a Button made destructive drew red while its Background field showed the old blue, and a theme
 * radius changed from 4 to 16 left the placeholder at 4 (Codex round 7, R7-03). The field now reads again after the
 * canvas paints, whenever it renders or the widget's resolved properties or the app theme change (checked in a browser).
 *
 * Mirrors Codex's theme-settled-refresh repro: the first read settles first, then the widget changes. Changing it before
 * the first read settled would pass without the fix.
 */
import React from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { DynamicFxTypeRenderer } from '../DynamicFxTypeRenderer';

jest.mock('@/modules/common/helpers/onboardingStoreHelper', () => ({ __esModule: true, default: undefined }));
jest.mock('@/modules/common/helpers/invitationStoreHelper', () => ({ __esModule: true, default: undefined }));

const ID = 'theme-settled-refresh';
let canvas;
beforeEach(() => {
  canvas = document.createElement('div');
  canvas.id = ID;
  canvas.innerHTML =
    '<div class="tj-shadcn"><button class="lk-theme-backgroundColor lk-theme-borderRadius" style="background-color: rgb(67, 104, 227); border-top-left-radius: 4px">Button</button></div>';
  document.body.appendChild(canvas);
});
afterEach(() => {
  cleanup();
  canvas.remove();
});

const field = (type, name) => (
  <DynamicFxTypeRenderer
    paramType={type}
    paramName={name}
    component="ShadButton"
    componentId={ID}
    onChange={() => {}}
    cyLabel="settled"
    meta={{}}
    value=""
  />
);
const settle = () =>
  act(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });

describe('a mounted theme-following field', () => {
  test('shows the colour the widget draws after its variant changes', async () => {
    const view = render(field('colorSwatches', 'backgroundColor'));
    await screen.findByText(/#4368E3/);
    await settle();
    // The Button turns destructive while the field stays open; the inspector draws the field again.
    canvas.querySelector('button').style.backgroundColor = 'rgb(215, 45, 57)';
    view.rerender(field('colorSwatches', 'backgroundColor'));
    await settle();
    await waitFor(() => expect(screen.getByText(/#D72D39/)).toBeInTheDocument());
  });

  test("shows the theme's new radius after the theme changes", async () => {
    const view = render(field('numberInput', 'borderRadius'));
    await screen.findByPlaceholderText('4');
    await settle();
    // The theme's radius goes from 4 to 16 while the field stays open; the inspector draws the field again.
    canvas.querySelector('button').style.borderTopLeftRadius = '16px';
    view.rerender(field('numberInput', 'borderRadius'));
    await settle();
    await waitFor(() => expect(screen.getByPlaceholderText('16')).toBeInTheDocument());
  });
});

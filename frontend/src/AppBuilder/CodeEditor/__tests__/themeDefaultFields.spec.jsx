import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
/**
 * A UI 2.0 widget's colour and radius styles have no default value: blank means the app theme decides. The Styles tab
 * drew a blank colour as an empty white swatch with no value and a blank radius as an empty box, which read as styles
 * that failed to load. Through the shared field renderer (DynamicFxTypeRenderer, as the inspector renders every style
 * field), a blank style now shows the colour the widget draws with a muted "Theme", or "Theme default" when no part of
 * the widget draws it; the radius shows the theme's radius as its placeholder. A set value shows as before.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { DynamicFxTypeRenderer } from '../DynamicFxTypeRenderer';
import { followsTheme, themeValueOf } from '../themeDefault';

// As in Ui2/__tests__/ui2Harness.js: these helpers load their store with a top-level await, which only the bundlers
// handle; under jest they log an error and export undefined. The stand-ins export the same undefined quietly.
jest.mock('@/modules/common/helpers/onboardingStoreHelper', () => ({ __esModule: true, default: undefined }));
jest.mock('@/modules/common/helpers/invitationStoreHelper', () => ({ __esModule: true, default: undefined }));

const STAT_ID = 'stat-theme-default';
let canvas;

// The Stat as the canvas draws it with no styles set: its classes read each style's variable, then the theme's token.
beforeEach(() => {
  canvas = document.createElement('div');
  canvas.id = STAT_ID;
  canvas.innerHTML = `
    <div class="tw-rounded-[var(--lk-radius,calc(var(--sc-radius)+4px))] tw-border-[color:var(--lk-border,var(--sc-border))] tw-bg-[color:var(--lk-bg,var(--sc-card))]"
      style="background-color: rgb(250, 250, 249); border-top-color: rgb(231, 229, 228); border-top-left-radius: 16px">
      <span class="tw-bg-[color:var(--lk-chip,color-mix(in_srgb,var(--lk-icon,var(--sc-primary))_12%,transparent))]" style="background-color: rgb(1, 1, 1)">
        <span class="tw-text-[color:var(--lk-icon,var(--sc-primary-ink))]" style="color: rgb(37, 99, 235)"></span>
      </span>
      <span class="tw-text-[color:var(--lk-label,var(--sc-muted-foreground))]" style="color: rgb(115, 115, 115)">Revenue</span>
    </div>`;
  document.body.appendChild(canvas);
});
afterEach(() => canvas.remove());

const field = (props) =>
  render(
    <DynamicFxTypeRenderer
      paramType="colorSwatches"
      component="ShadStat"
      componentId={STAT_ID}
      onChange={() => {}}
      cyLabel="field"
      meta={{}}
      {...props}
    />
  );
const swatch = (container) => container.querySelector('.color-icon');

describe('A UI 2.0 style left blank follows the theme', () => {
  it('a blank colour shows the colour the widget draws and says Theme', async () => {
    const { container } = field({ paramName: 'backgroundColor', value: '' });
    expect(await screen.findByText('Theme')).toBeInTheDocument();
    expect(swatch(container).style.backgroundColor).toBe('rgb(250, 250, 249)');
  });

  it('reads the part that draws the style, not one that only mixes it into another', async () => {
    const { container } = field({ paramName: 'iconColor', value: '' });
    expect(await screen.findByText('Theme')).toBeInTheDocument();
    expect(swatch(container).style.backgroundColor).toBe('rgb(37, 99, 235)');
  });

  it("a colour no part of the widget draws shows the theme's colour for its kind, not Theme default", async () => {
    // A trend colour with no trend on the card: the theme's error colour (its default where the token cannot be read).
    const { container } = field({ paramName: 'negativeColor', value: '' });
    expect(await screen.findByText('Theme')).toBeInTheDocument();
    expect(screen.queryByText('Theme default')).toBeNull();
    expect(swatch(container).style.backgroundColor).toBe('rgb(220, 38, 38)');
    expect(swatch(container).style.borderStyle).not.toBe('dashed');
  });

  it('a set colour shows as before, and clearing it returns to the theme', async () => {
    const view = field({ paramName: 'labelColor', value: '#ff0000' });
    expect(screen.getByText('#ff0000')).toBeInTheDocument();
    expect(screen.queryByText('Theme')).toBeNull();
    expect(swatch(view.container).style.backgroundColor).toBe('rgb(255, 0, 0)');

    view.rerender(
      <DynamicFxTypeRenderer
        paramType="colorSwatches"
        component="ShadStat"
        componentId={STAT_ID}
        onChange={() => {}}
        cyLabel="field"
        meta={{}}
        paramName="labelColor"
        value=""
      />
    );
    expect(await screen.findByText('Theme')).toBeInTheDocument();
    expect(swatch(view.container).style.backgroundColor).toBe('rgb(115, 115, 115)');
  });

  it('a blank radius shows the theme radius as its placeholder', async () => {
    const { container } = field({ paramType: 'numberInput', paramName: 'borderRadius', value: '' });
    const input = container.querySelector('input');
    await screen.findByPlaceholderText('16');
    expect(input.value).toBe('');
  });

  it('applies to every UI 2.0 widget style, and to nothing else', () => {
    expect(
      followsTheme({ component: 'ShadKanban', paramName: 'cardBackgroundColor', paramType: 'colorSwatches' })
    ).toBe(true);
    expect(followsTheme({ component: 'ShadCardGrid', paramName: 'cardBackground', paramType: 'colorSwatches' })).toBe(
      true
    );
    // A set value, a native widget, a property rather than a style.
    expect(
      followsTheme({ component: 'ShadStat', paramName: 'labelColor', paramType: 'colorSwatches', value: '#000' })
    ).toBe(false);
    expect(followsTheme({ component: 'Button', paramName: 'backgroundColor', paramType: 'colorSwatches' })).toBe(false);
    expect(followsTheme({ component: 'ShadStat', paramName: 'label', paramType: 'colorSwatches' })).toBe(false);
  });

  it('a native widget keeps its blank swatch as it was', () => {
    render(
      <DynamicFxTypeRenderer
        paramType="colorSwatches"
        component="Text"
        componentId="text1"
        paramName="textColor"
        value=""
        onChange={() => {}}
        cyLabel="field"
        meta={{}}
      />
    );
    expect(screen.queryByText('Theme')).toBeNull();
    expect(screen.queryByText('Theme default')).toBeNull();
  });

  it('finds nothing for a widget that is not on the canvas', () => {
    expect(themeValueOf('missing', 'ShadStat', 'backgroundColor')).toBeNull();
  });
});

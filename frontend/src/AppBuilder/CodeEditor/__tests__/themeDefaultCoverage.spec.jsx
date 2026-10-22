import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
/**
 * Every UI 2.0 widget's colour, radius and size styles are blank by default: blank means the app theme decides. The
 * Styles tab showed the theme's value only where a part of the widget read the style's variable with the theme as
 * its fallback. A Button, a Badge or an Alert (whose variants each draw their own colours) applies a style's class only
 * once it is set, so all their fields said "Theme default" with an empty dashed swatch, and the radius "Theme": read as
 * blank. Now an unset part is marked for the inspector, and any style no part draws falls back to the theme token (or
 * size) a style of its kind takes. This walks every UI 2.0 config, so no widget is left out.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager';
import { whenSet } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import { DynamicFxTypeRenderer } from '../DynamicFxTypeRenderer';
import { colorText, themeFallback, themeValueOf } from '../themeDefault';

jest.mock('@/modules/common/helpers/onboardingStoreHelper', () => ({ __esModule: true, default: undefined }));
jest.mock('@/modules/common/helpers/invitationStoreHelper', () => ({ __esModule: true, default: undefined }));

const SIZE_PROPERTIES = ['borderTopLeftRadius', 'fontSize', 'width', 'columnGap', 'height'];
const themedStyles = Object.entries(componentTypeDefinitionMap)
  .filter(([type]) => type.startsWith('Shad'))
  .flatMap(([type, config]) =>
    Object.entries(config.styles ?? {})
      .filter(([, style]) => ['colorSwatches', 'numberInput'].includes(style.type))
      .map(([key, style]) => [type, key, style.type])
  );

describe('every UI 2.0 colour and size style has a theme value', () => {
  it('walks every UI 2.0 widget', () => {
    expect(new Set(themedStyles.map(([type]) => type)).size).toBeGreaterThan(70);
    expect(themedStyles.length).toBeGreaterThan(500);
  });

  test.each(themedStyles)('%s %s (%s)', (type, key, fieldType) => {
    const fallback = themeFallback(key);
    expect(fallback).not.toBeNull();
    if (fieldType === 'numberInput') {
      expect(SIZE_PROPERTIES).toContain(fallback.property);
    } else {
      expect(fallback.value).toMatch(/^var\(--sc-[a-z-]+\)$/);
    }
  });
});

describe('a part whose class applies only once its style is set', () => {
  const ID = 'button-theme-default';
  let canvas;
  beforeEach(() => {
    // The Button as the canvas draws it with no styles set: its variant's classes, and the marks whenSet leaves.
    canvas = document.createElement('div');
    canvas.id = ID;
    canvas.innerHTML = `<div class="tj-shadcn"><button class="tw-bg-ui2-primary hover:tw-bg-ui2-primary/90 ${[
      whenSet({}, 'backgroundColor', 'tw-bg-[color:var(--lk-bg)]'),
      whenSet({}, 'textColor', 'tw-text-[color:var(--lk-fg)]'),
      whenSet({}, 'borderColor', 'tw-border-[color:var(--lk-border)]'),
      whenSet({}, 'borderRadius', 'tw-rounded-[var(--lk-radius)]'),
    ].join(
      ' '
    )}" style="background-color: rgb(67, 104, 227); color: rgb(255, 255, 255); border-top-color: rgba(0, 0, 0, 0); border-top-left-radius: 6px">Button</button></div>`;
    document.body.appendChild(canvas);
  });
  afterEach(() => canvas.remove());

  it('is marked while its style is unset, and drawn with the style once set', () => {
    expect(whenSet({}, 'backgroundColor', 'tw-bg-[color:var(--lk-bg)]')).toBe('lk-theme-backgroundColor');
    expect(whenSet({ backgroundColor: '#f00' }, 'backgroundColor', 'tw-bg-[color:var(--lk-bg)]')).toBe(
      'tw-bg-[color:var(--lk-bg)]'
    );
  });

  it("reads the variant's own colours and radius off the marked part", () => {
    expect(themeValueOf(ID, 'ShadButton', 'backgroundColor')).toBe('rgb(67, 104, 227)');
    expect(themeValueOf(ID, 'ShadButton', 'textColor')).toBe('rgb(255, 255, 255)');
    expect(themeValueOf(ID, 'ShadButton', 'borderColor')).toBe('rgba(0, 0, 0, 0)');
    expect(themeValueOf(ID, 'ShadButton', 'borderRadius')).toBe('6px');
  });

  it('the fields show them: a filled swatch with its value and Theme, the radius as the placeholder', async () => {
    const field = (props) =>
      render(
        <DynamicFxTypeRenderer
          component="ShadButton"
          componentId={ID}
          onChange={() => {}}
          cyLabel="field"
          meta={{}}
          value=""
          {...props}
        />
      );
    const colour = field({ paramType: 'colorSwatches', paramName: 'backgroundColor' });
    expect(await screen.findByText('Theme')).toBeInTheDocument();
    expect(screen.getByText(/#4368E3/)).toBeInTheDocument();
    expect(colour.container.querySelector('.color-icon').style.backgroundColor).toBe('rgb(67, 104, 227)');
    colour.unmount();

    const radius = field({ paramType: 'numberInput', paramName: 'borderRadius' });
    await screen.findByPlaceholderText('6');
    expect(radius.container.querySelector('input').value).toBe('');
  });

  it('writes a drawn colour as hex', () => {
    expect(colorText('rgb(67, 104, 227)')).toBe('#4368E3');
    expect(colorText('rgba(0, 0, 0, 0.25)')).toBe('#00000040');
    expect(colorText('color(srgb 0.262745 0.407843 0.890196)')).toBe('#4368E3');
    expect(colorText('color(srgb 1 1 1 / 0.5)')).toBe('#FFFFFF80');
    expect(colorText('oklch(0.5 0.1 200)')).toBe('oklch(0.5 0.1 200)');
  });
});

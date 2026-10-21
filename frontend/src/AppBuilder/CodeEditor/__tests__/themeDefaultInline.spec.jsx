import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
/**
 * The theme-default display for widgets that draw their styles inline. A Card grid's card draws
 * background: var(--lk-bg,var(--sc-card)) and border-radius inline (no utility class), and the Kanban keeps its own look
 * module (kanbanLook.ts), with the theme's values as inline fallbacks: their colour fields showed "Theme default" and
 * their radius "Theme" where the Stat showed the theme's colour and radius. Both are read now: an inline declaration
 * off the style attribute's text, and the Kanban's fallbacks computed inside the widget's own root.
 *
 * jsdom substitutes no CSS variables, so getComputedStyle is stood in for by a resolver over a token table, as the
 * browser does it (checked in a browser: Card grid #fff / 14px, Kanban card #fff / 10px, column 14px).
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { DynamicFxTypeRenderer } from '../DynamicFxTypeRenderer';
import { themeValueOf } from '../themeDefault';

jest.mock('@/modules/common/helpers/onboardingStoreHelper', () => ({ __esModule: true, default: undefined }));
jest.mock('@/modules/common/helpers/invitationStoreHelper', () => ({ __esModule: true, default: undefined }));

const TOKENS = { '--sc-card': 'rgb(250, 250, 249)', '--sc-border': 'rgb(228, 231, 235)', '--sc-radius': '10px' };
const resolve = (value) =>
  String(value ?? '')
    .replace(/calc\(var\(--sc-radius\) \+ 4px\)/g, '14px')
    .replace(
      /var\((--[\w-]+)(?:,\s*([^()]*(?:\([^()]*\))?[^()]*))?\)/g,
      (_, name, fallback) => TOKENS[name] ?? resolve(fallback)
    )
    .trim();
const SHORTHANDS = {
  backgroundColor: 'background',
  borderTopColor: 'border-color',
  borderTopLeftRadius: 'border-radius',
};
const declarations = (el) =>
  Object.fromEntries(
    (el.getAttribute('style') || '')
      .split(';')
      .map((d) => d.split(':'))
      .filter(([p, ...v]) => p && v.length)
      .map(([p, ...v]) => [p.trim(), v.join(':').trim()])
  );
let real;
beforeAll(() => {
  real = window.getComputedStyle;
  window.getComputedStyle = (el) => {
    const own = { ...declarations(el) };
    ['color', 'background-color', 'border-top-left-radius'].forEach((p) => {
      if (el.style[p.replace(/-(\w)/g, (_, c) => c.toUpperCase())]) own[p] = own[p] ?? el.style.getPropertyValue(p);
    });
    return new Proxy(
      {},
      {
        get: (_, key) =>
          key === 'getPropertyValue'
            ? (name) => resolve(own[name])
            : resolve(own[SHORTHANDS[key]] ?? own[String(key).replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)]),
      }
    );
  };
});
afterAll(() => {
  window.getComputedStyle = real;
});

let canvas;
beforeEach(() => {
  canvas = document.createElement('div');
  canvas.id = 'w1';
  canvas.innerHTML = `
    <div class="tj-shadcn">
      <button style="background: var(--lk-bg,var(--sc-card)); border-radius: var(--lk-radius,calc(var(--sc-radius) + 4px)); --cg-border: var(--lk-border,var(--sc-border))">Card</button>
    </div>`;
  document.body.appendChild(canvas);
});
afterEach(() => canvas.remove());

describe('theme values a widget draws inline', () => {
  test('a Card grid card: its background, border and radius', () => {
    expect(themeValueOf('w1', 'ShadCardGrid', 'cardBackground')).toBe('rgb(250, 250, 249)');
    expect(themeValueOf('w1', 'ShadCardGrid', 'borderColor')).toBe('rgb(228, 231, 235)');
    expect(themeValueOf('w1', 'ShadCardGrid', 'borderRadius')).toBe('14px');
  });

  test("the Kanban's column and card fallbacks, computed in the widget", () => {
    expect(themeValueOf('w1', 'ShadKanban', 'cardBackgroundColor')).toBe('rgb(250, 250, 249)');
    expect(themeValueOf('w1', 'ShadKanban', 'cardBorderColor')).toBe('rgb(228, 231, 235)');
    expect(themeValueOf('w1', 'ShadKanban', 'cardBorderRadius')).toBe('10px');
    expect(themeValueOf('w1', 'ShadKanban', 'columnBorderRadius')).toBe('14px');
  });

  test('the fields show them: a filled swatch with Theme, the radius as the placeholder', async () => {
    const { container } = render(
      <DynamicFxTypeRenderer
        paramType="colorSwatches"
        component="ShadKanban"
        componentId="w1"
        paramName="cardBackgroundColor"
        value=""
        onChange={() => {}}
        cyLabel="card"
        meta={{}}
      />
    );
    expect(await screen.findByText('Theme')).toBeInTheDocument();
    expect(container.querySelector('.color-icon').style.backgroundColor).toBe('rgb(250, 250, 249)');

    render(
      <DynamicFxTypeRenderer
        paramType="numberInput"
        component="ShadCardGrid"
        componentId="w1"
        paramName="borderRadius"
        value=""
        onChange={() => {}}
        cyLabel="radius"
        meta={{}}
      />
    );
    expect(await screen.findByPlaceholderText('14')).toBeInTheDocument();
  });
});

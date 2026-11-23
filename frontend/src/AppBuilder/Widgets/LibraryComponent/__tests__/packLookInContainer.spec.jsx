import React from 'react';
import { render, waitFor } from '@testing-library/react';

import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule, toolJetSdk as ToolJet } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';
import { AccordionContainer } from '../../../../../../packs/shadcn/src/components/AccordionContainer';

installBrowserStubs();

// QA: Ant Design and Material UI components changed their look inside any Rocket 2.0 container (a Record list: its
// font, text, borders, tags and chips). Custom properties inherit, through a container's drop area too. A Rocket
// component follows the app theme, so its host sets ToolJet's theme tokens (--tj-brand, --tj-text, --tj-radius, ...);
// an Ant or MUI one takes them only once the app applies a theme and keeps its stock look without one. An Ant or MUI
// component in a Rocket Card's body read the card's tokens and drew in ToolJet's colours, font and radius there, and in
// its stock look on the canvas. A container's own look variables (a Rocket Accordion's Divider color) reached the
// components in it the same way. The host, the inline SDK and the pack's Accordion are the real ones; the bundle's module
// loading is replaced. jsdom resolves no custom property, so the spec reads the rules each host's own sheets apply to it.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

// A container from a pack that follows the app theme (the Rocket 2.0 Card): a body builders drop components into.
const Card = () => (
  <div data-testid="card">
    <ToolJet.Slot name="body" />
  </div>
);

// A component from a pack drawn in its own design system (an Ant or MUI Record list).
const List = () => (
  <ul data-testid="list">
    <li>Maya Chen</li>
  </ul>
);

const props = (name, dataCy, extra = {}) => ({
  bundleUrl: `${name}.js`,
  cssUrl: `${name}.css`,
  cacheKey: `${name}|v1`,
  componentName: name,
  componentProps: {},
  componentStyles: {},
  renderSlot: () => null,
  setExposedVariable: jest.fn(),
  fireEvent: jest.fn(),
  actions: new Map(),
  dataCy,
  ...extra,
});

// The list in the card's body, where the canvas draws a component dropped there: a light-DOM child of the card's host.
const renderListInCard = async ({ listThemed }) => {
  const view = render(
    <InlineLibraryComponent
      {...props('Card', 'card1', {
        renderSlot: (slot) =>
          slot === 'body' ? <InlineLibraryComponent {...props('List', 'list1', { themed: listThemed })} /> : null,
      })}
    />
  );
  const card = view.container.querySelector('[data-cy="card1"]');
  const list = () => card.querySelector('[data-cy="list1"]');
  await waitFor(() => expect(list()?.shadowRoot?.querySelector('[data-testid="list"]')).toBeTruthy());
  return { card, list: list() };
};

// The rules of a sheet's text, parsed as the document parses a <style> (jsdom parses none inside a shadow root).
const rulesOf = (text) => {
  const style = document.createElement('style');
  style.textContent = text;
  document.head.appendChild(style);
  const rules = [...style.sheet.cssRules];
  style.remove();
  return rules;
};

// The theme tokens a host's own sheets set on it: each :host(...) rule whose selector the host matches.
const tokensSetOn = (host) => {
  const tokens = {};
  host.shadowRoot.querySelectorAll('style').forEach((style) => {
    rulesOf(style.textContent).forEach((rule) => {
      const match = /^:host(?:\((.+)\))?$/.exec(rule.selectorText ?? '');
      if (!match || (match[1] && !host.matches(match[1]))) return;
      for (let i = 0; i < rule.style.length; i += 1) {
        const name = rule.style[i];
        if (name.startsWith('--tj-')) tokens[name] = rule.style.getPropertyValue(name).trim();
      }
    });
  });
  return tokens;
};

describe('pack theme tokens in a container', () => {
  beforeEach(() => {
    loadLibraryModule.mockResolvedValue({ Card, List });
  });
  afterEach(() => loadLibraryModule.mockReset());

  test('[PackComponent-THEME-001] a component in its own design system takes none of the theme tokens a themed container around it sets', async () => {
    // Break this catches: an Ant or MUI component in a Rocket container reading the container's --tj-* tokens through
    // the drop area, so it drew in ToolJet's colours, font and radius inside the container and in its stock look on
    // the canvas (QA: Ant Design and Material UI components change look inside any Rocket container).
    const { card, list } = await renderListInCard({ listThemed: false });
    const cardTokens = tokensSetOn(card);

    expect(cardTokens['--tj-brand']).toBe('var(--cc-primary-brand, #4368e3)');
    // The list sets each of them itself, to initial (undefined, as on the canvas), so the card's never reach it.
    expect(tokensSetOn(list)).toEqual(Object.fromEntries(Object.keys(cardTokens).map((name) => [name, 'initial'])));
  });

  test('[PackComponent-THEME-002] once the app applies a theme, a component in its own design system sets the theme tokens itself', async () => {
    // Break this catches: the reset reaching a themed component too, so an applied ToolJet theme no longer restyled the
    // Ant and MUI components.
    const { card, list } = await renderListInCard({ listThemed: true });

    expect(tokensSetOn(list)).toEqual(tokensSetOn(card));
    expect(tokensSetOn(list)['--tj-text']).toBe('var(--cc-primary-text, #1b1f24)');
  });
});

describe("a container's own look variables", () => {
  afterEach(() => loadLibraryModule.mockReset());

  test("[PackComponent-THEME-003] a Rocket Accordion container's colours stay out of the components in its sections", async () => {
    // Break this catches: the accordion's Divider, Item title and Chevron colours, set as variables on its root,
    // reaching the components dropped in a section, so a red divider drew a Rocket input's and an Ant Schedule's
    // borders red there.
    loadLibraryModule.mockResolvedValue({ AccordionContainer });
    const view = render(
      <InlineLibraryComponent
        {...props('AccordionContainer', 'accordion1', {
          componentStyles: { dividerColor: '#ff0000', titleColor: '#00aa00', iconColor: '#0000ff' },
          host: makeHost('AccordionContainer'),
        })}
      />
    );
    const root = view.container.querySelector('[data-cy="accordion1"]').shadowRoot;
    await waitFor(() => expect(root.querySelector('[data-tj-slot="section_general"]')).toBeTruthy());
    const own = root.querySelector('.n2-accordion').style;
    const looks = Array.from({ length: own.length }, (_, i) => own.item(i)).filter((name) => name.startsWith('--'));

    expect(looks).toEqual(expect.arrayContaining(['--lk-border', '--lk-title', '--lk-icon']));
    expect(own.getPropertyValue('--lk-border')).toBe('#ff0000');
    // The section's drop area sets each of them back to initial (undefined), so nothing dropped in it sees them.
    const area = root.querySelector('[data-tj-slot="section_general"]').style;
    expect(Object.fromEntries(looks.map((name) => [name, area.getPropertyValue(name)]))).toEqual(
      Object.fromEntries(looks.map((name) => [name, 'initial']))
    );
  });
});

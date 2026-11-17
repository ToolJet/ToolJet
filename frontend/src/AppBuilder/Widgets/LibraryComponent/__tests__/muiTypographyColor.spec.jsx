import React from 'react';
import { render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';

installBrowserStubs();

// QA item 28: the MUI Typography and Typography Heading drew their text in the inherited colour whatever Color
// (error.main, text.secondary) or Styles › Text primary said. Typography's color prop takes only palette names
// (error, textSecondary) in MUI 9; a theme path is resolved by sx. The pack's components, MUI and emotion are the real
// ones; the colour is read from the rules emotion writes for the text's class (caught as written: jsdom keeps no
// stylesheet for a shadow root's style tags, and computes no styles).
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const pack = require('../../../../../../packs/mui/src/index.ts');
// The emotion sheet the pack writes its rules with, from its own dependencies.
const { StyleSheet } = require('../../../../../../packs/mui/node_modules/@emotion/sheet');

const written = [];
beforeEach(() => {
  written.length = 0;
  // The pack reads a colour style back through a canvas's fillStyle (normalizeColor); jsdom's stub context keeps
  // nothing, so it keeps a hex colour as a browser does.
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => {
    let fill = '#000000';
    return {
      get fillStyle() {
        return fill;
      },
      set fillStyle(value) {
        if (/^#[0-9a-f]{6}$/i.test(String(value))) fill = String(value).toLowerCase();
      },
    };
  });
  const insert = StyleSheet.prototype.insert;
  jest.spyOn(StyleSheet.prototype, 'insert').mockImplementation(function (rule) {
    written.push(rule);
    try {
      return insert.call(this, rule);
    } catch {
      return undefined;
    }
  });
});
afterEach(() => jest.restoreAllMocks());

let mounts = 0;
const mount = async (name, props, styles = {}) => {
  loadLibraryModule.mockResolvedValue(pack);
  mounts += 1;
  const view = render(
    <InlineLibraryComponent
      bundleUrl="mui.js"
      cssUrl="mui.css"
      cacheKey="mui-typography-color"
      componentName={name}
      componentProps={props}
      componentStyles={styles}
      renderSlot={() => null}
      setExposedVariable={() => {}}
      fireEvent={() => {}}
      actions={new Map()}
      host={makeHost(name, {})}
      dataCy={`mui-text-${mounts}`}
    />
  );
  const root = () => view.container.querySelector(`[data-cy="mui-text-${mounts}"]`).shadowRoot;
  await waitFor(() => expect(root()?.querySelector('.MuiTypography-root')).toBeTruthy());
  return root();
};

// The colour the last rule written for the text's own class sets, if any.
const colorOf = (root) => {
  const own = [...root.querySelector('.MuiTypography-root').classList].filter((c) => /^mui-/.test(c));
  const colors = written
    .filter((rule) => own.some((c) => rule.startsWith(`.${c}{`)))
    .map((rule) => rule.match(/[{;]color:([^;}]+)/)?.[1])
    .filter(Boolean);
  return colors.pop();
};

describe.each(['Typography', 'TypographyHeading'])('MUI %s', (name) => {
  it.each([
    ['error.main', '#d32f2f'],
    ['primary.main', '#1976d2'],
    ['text.secondary', 'rgba(0, 0, 0, 0.6)'],
  ])('draws Color %s in the theme colour', async (color, expected) => {
    const root = await mount(name, { children: 'Hello', color });
    expect(colorOf(root)).toBe(expected);
  });

  it('draws the default colour in Styles › Text primary', async () => {
    const root = await mount(name, { children: 'Hello' }, { textPrimary: '#e11d48' });
    expect(colorOf(root)?.toLowerCase()).toBe('#e11d48');
  });
});

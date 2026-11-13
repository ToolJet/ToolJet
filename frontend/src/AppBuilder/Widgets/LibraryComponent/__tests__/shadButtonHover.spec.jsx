import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';

installBrowserStubs();

// Rocket 2.0 (shadcn pack) Button hover background (pack_bug_fixes.md #3). The real Button, inline SDK and host
// renderer; only module and CSS loading is replaced. jsdom cannot hover, so the oracle is what the hover rule reads:
// whether the button applies the hover colour (has-hover) and which one (--lk-hover), as ui2-nav.css draws it.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const SOURCE = require('../../../../../../packs/shadcn/src/index.ts');

const BRAND = 'var(--cc-primary-brand)';

afterEach(cleanup);

let serial = 0;
// The style as the host stores it when the builder never touched it: the manifest default, which is Brand.
async function mountButton(props = {}, styles = {}) {
  loadLibraryModule.mockResolvedValue({ Button: SOURCE.Button });
  const view = render(
    <InlineLibraryComponent
      bundleUrl="shadcn-Button.js"
      cssUrl="shadcn-Button.css"
      cacheKey={`button-hover-${++serial}`}
      componentName="Button"
      componentProps={props}
      componentStyles={styles}
      renderSlot={() => null}
      setExposedVariable={() => {}}
      actions={new Map()}
      host={makeHost('Button', {})}
      dataCy="hover"
      fireEvent={() => {}}
    />
  );
  const shadow = () => view.container.querySelector('[data-cy="hover"]')?.shadowRoot;
  await waitFor(() => expect(shadow()?.querySelector('button')).not.toBeNull());
  const button = shadow().querySelector('button');
  const vars = shadow().querySelector('.ui').style;
  return { button, hover: vars.getPropertyValue('--lk-hover'), radius: vars.getPropertyValue('--lk-radius') };
}

describe('Button hover background', () => {
  test('a default Button with hover left at Brand keeps its derived darker hover', async () => {
    // The pack darkens the default variant on hover (ui.css), so an untouched hover field is "not set".
    const { button, hover } = await mountButton({}, { hoverBackgroundColor: BRAND });

    expect(button.classList.contains('has-hover')).toBe(false);
    expect(hover).toBe('');
  });

  test('a default Button hovers to the colour the builder picked', async () => {
    // Break this catches: a picked hover colour ignored.
    const { button, hover } = await mountButton({}, { hoverBackgroundColor: '#ff0000' });

    expect(button.classList.contains('has-hover')).toBe(true);
    expect(hover).toBe('#ff0000');
  });

  test('a secondary Button with hover left at Brand keeps its own derived hover', async () => {
    // Break this catches: a secondary/outline/ghost/destructive button turning Brand on hover because the field
    // still holds its Brand default.
    const { button, hover } = await mountButton({ variant: 'secondary' }, { hoverBackgroundColor: BRAND });

    expect(button.classList.contains('has-hover')).toBe(false);
    expect(hover).toBe('');
  });

  test('a secondary Button hovers to a colour the builder picked', async () => {
    // Break this catches: the variant guard also swallowing a hover colour that was picked.
    const { button, hover } = await mountButton({ variant: 'secondary' }, { hoverBackgroundColor: '#00ff00' });

    expect(button.classList.contains('has-hover')).toBe(true);
    expect(hover).toBe('#00ff00');
  });
});

describe('Button radius', () => {
  test('left at "auto" it draws the theme radius, with no radius of its own', async () => {
    // Break this catches: the word "auto" written out as a radius.
    const { radius } = await mountButton({}, { borderRadius: 'auto' });

    expect(radius).toBe('');
  });

  test.each([
    [12, '12px'],
    ['12', '12px'],
  ])('a radius of %p draws %s', async (value, drawn) => {
    // Break this catches: a typed radius ignored once the field's default became text.
    const { radius } = await mountButton({}, { borderRadius: value });

    expect(radius).toBe(drawn);
  });
});

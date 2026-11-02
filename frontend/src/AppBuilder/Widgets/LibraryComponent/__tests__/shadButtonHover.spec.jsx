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
const BRAND_DRAWN = 'var(--cc-primary-brand, #4368e3)';

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
  return { button, hover: shadow().querySelector('.ui').style.getPropertyValue('--lk-hover') };
}

describe('Button hover background', () => {
  test('a default Button with hover left at Brand hovers to Brand, as the field shows', async () => {
    // Break this catches: Brand read as "not set", so the hover rule falls back to darkening the background.
    const { button, hover } = await mountButton({}, { hoverBackgroundColor: BRAND });

    expect(button.classList.contains('has-hover')).toBe(true);
    expect(hover).toBe(BRAND_DRAWN);
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

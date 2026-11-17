import React from 'react';
import { render, waitFor } from '@testing-library/react';

import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';

installBrowserStubs();

// QA: a Material UI Text Field showed some of its styles (Variant, Size, Color) on the Properties tab. They are styles
// now, for each field drawn as MUI's TextField: what the Styles tab sets is what the field draws. The pack components,
// the inline SDK and the host renderer are the real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const pack = require('../../../../../../packs/mui/src/index.ts');

afterEach(() => {
  document.body.innerHTML = '';
});

let mounts = 0;
const mount = async (name, styles) => {
  loadLibraryModule.mockResolvedValue(pack);
  mounts += 1;
  const view = render(
    <InlineLibraryComponent
      bundleUrl="mui.js"
      cssUrl="mui.css"
      cacheKey="mui-field-look"
      componentName={name}
      componentProps={{}}
      componentStyles={styles}
      renderSlot={() => null}
      setExposedVariable={() => {}}
      fireEvent={() => {}}
      actions={new Map()}
      host={{ ...makeHost(name, { validation: 'text' }), formField: true }}
      dataCy={`look-${mounts}`}
    />
  );
  const widget = view.container.querySelector(`[data-cy="look-${mounts}"]`);
  await waitFor(() => expect(widget.shadowRoot?.querySelector('.MuiInputBase-root')).toBeTruthy());
  return widget.shadowRoot.querySelector('.MuiInputBase-root');
};

describe('the look of a Material UI field from its styles', () => {
  test.each(['TextField', 'MultilineTextField', 'NumberField', 'Select', 'Autocomplete'])(
    '[PackComponent-MUILOOK-002] %s draws the variant, size and color its styles set',
    async (name) => {
      // Break this catches: the field reading its look from properties only, so the Styles tab could not change it.
      const field = await mount(name, { variant: 'filled', size: 'small', color: 'secondary' });

      expect(field.classList.contains('MuiFilledInput-root')).toBe(true);
      expect(field.classList.contains('MuiInputBase-sizeSmall')).toBe(true);
      expect(field.classList.contains('MuiInputBase-colorSecondary')).toBe(true);
    }
  );

  test("[PackComponent-MUILOOK-003] with no styles set, a field draws MUI's default look", async () => {
    const field = await mount('TextField', {});

    expect(field.classList.contains('MuiOutlinedInput-root')).toBe(true);
    expect(field.classList.contains('MuiInputBase-sizeSmall')).toBe(false);
    expect(field.classList.contains('MuiInputBase-colorPrimary')).toBe(true);
  });
});

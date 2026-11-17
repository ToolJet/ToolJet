import { waitFor } from '@testing-library/react';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';

installBrowserStubs();

// QA (PF-267): a Rocket 2.0 Dialog whose Button colour, Button text colour or Dialog background was bound to a number,
// an object or an array was replaced by 'Something went wrong' (themeVars called .replace on it); a bad text colour is
// already ignored. The pack component, the inline SDK and the host renderer are the real ones; only module and CSS
// loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

let consoleError;
beforeEach(() => {
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  consoleError.mockRestore();
  document.body.innerHTML = '';
});

const BAD = [
  ['the number 12345', 12345],
  ['an object', { a: 1 }],
  ['an array', [1, null, 'x']],
];
const layer = () => document.querySelector('.tj-cc-popup-host')?.shadowRoot;

describe.each(BAD)('Rocket Dialog: a colour style bound to %s is ignored', (_, bad) => {
  test.each(['buttonColor', 'buttonTextColor'])(
    '[PackComponent-DIALOG-COLOR-001] %s keeps the trigger drawn',
    async (style) => {
      const v = await mountPack('shadcn', 'Dialog', {}, { styles: { [style]: bad } });
      expect(v.root().querySelector('button')).toBeTruthy();
      expect(v.root().querySelector('.ui')?.style.getPropertyValue('--ui-btn-color')).toBe('');
    }
  );

  test('[PackComponent-DIALOG-COLOR-002] dialogBackground keeps the opened dialog drawn', async () => {
    const v = await mountPack('shadcn', 'Dialog', {}, { styles: { dialogBackground: bad } });
    await v.run('open');
    await waitFor(() => expect(layer()?.querySelector('.ui-dialog-title')).toBeTruthy());
  });
});

test('[PackComponent-DIALOG-COLOR-003] control: a colour text still colours the button', async () => {
  const v = await mountPack('shadcn', 'Dialog', {}, { styles: { buttonColor: '#ff0000' } });
  expect(v.root().querySelector('.ui').style.getPropertyValue('--ui-btn-color')).toBe('#ff0000');
});

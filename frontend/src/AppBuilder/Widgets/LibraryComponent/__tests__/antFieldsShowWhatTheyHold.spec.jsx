import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';
import { hostValidation } from './fuzz/hostValidation';
import { mountPack, settle } from './packMount';

installBrowserStubs();

// QA AD-47, AD-48, AD-49 and AD-50, four Ant Design fields and widgets that did not show or expose what they held:
// - a Hero with no action button showed nothing while loading (only the action button had a spinner);
// - an OTP given 12345678 under Length 6 showed 123456 but exposed 12345678 with isComplete false, and kept ab12 in
//   lower case where typed letters turn upper case;
// - a Pagination with Page size 0 drew the fallback size a page but exposed pageSize 0;
// - a Password shorter than its Min length property only showed a hint: isValid stayed true.
// The pack's components, the inline SDK and the host renderer are the real ones; only module and CSS loading is
// replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Ant Design Hero: loading', () => {
  test('[PackComponent-HEROLOAD-001] a Hero with no action button shows a spinner while loading', async () => {
    const v = await mountPack('antd', 'Hero', {}, { host: { loading: true } });

    expect(v.root().querySelector('.ant-spin-spinning')).not.toBeNull();
  });

  // Characterization: not loading, no spinner.
  test('[PackComponent-HEROLOAD-002] a Hero that is not loading shows no spinner', async () => {
    const v = await mountPack('antd', 'Hero', {});

    expect(v.root().querySelector('.ant-spin-spinning')).toBeNull();
  });
});

describe('Ant Design OTP: a value set from outside is cleaned as typing is', () => {
  const boxes = (v) => [...v.root().querySelectorAll('input')].map((input) => input.value).join('');

  test('[PackComponent-OTPVALUE-001] 12345678 under Length 6 is 123456, complete, with no event', async () => {
    const v = await mountPack('antd', 'OTP', { length: 6, value: '12345678' });
    await settle();

    expect(boxes(v)).toBe('123456');
    expect(v.exposed.value).toBe('123456');
    expect(v.exposed.isComplete).toBe(true);
    expect(v.events).toEqual([]);
  });

  test('[PackComponent-OTPVALUE-002] alphanumeric ab12 is AB12 in the boxes and in value', async () => {
    const v = await mountPack('antd', 'OTP', { characters: 'alphanumeric', value: 'ab12' });
    await settle();

    expect(boxes(v)).toBe('AB12');
    expect(v.exposed.value).toBe('AB12');
    expect(v.exposed.isComplete).toBe(false);
  });
});

// The fallback page size is 1, the Pagination's default since #18990; the exposed pageSize is the size drawn.
describe('Ant Design Pagination: Page size 0', () => {
  test('[PackComponent-PAGESIZE-001] draws 1 a page and exposes pageSize 1', async () => {
    const v = await mountPack('antd', 'Pagination', { total: 50, pageSize: 0 });
    await settle();

    const pages = [...v.root().querySelectorAll('.ant-pagination-item')].map((e) => e.textContent);
    expect(pages[pages.length - 1]).toBe('50');
    expect(v.exposed.pageSize).toBe(1);
  });
});

describe('Ant Design Password: the Min length property', () => {
  // isValid as the host publishes it (usePackHost's useHostValidation, with an empty Validation section).
  const validity = async (props) => {
    const published = {};
    const useValidation = hostValidation((key, value) => {
      published[key] = value;
    });
    await mountPack('antd', 'Password', props, {
      host: { ...makeHost('Password', { validation: 'text' }), useValidation },
    });
    await settle();
    return published.isValid;
  };

  test('[PackComponent-PWMIN-001] abc under Min length 8 is not valid', async () => {
    expect(await validity({ minLength: 8, value: 'abc' })).toBe(false);
  });

  // Characterization: long enough, or empty (Required decides that), is valid.
  test('[PackComponent-PWMIN-002] abcdefgh, or nothing, is valid', async () => {
    expect(await validity({ minLength: 8, value: 'abcdefgh' })).toBe(true);
    expect(await validity({ minLength: 8, value: '' })).toBe(true);
  });
});

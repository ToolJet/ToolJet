import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';

installBrowserStubs();

// QA: a Rocket 2.0 Form's <form> had no accessible name (no aria-labelledby or aria-label), so a screen reader did not
// list it as a form region; only its fields were labelled. The pack component, the inline SDK and the host renderer are
// the real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

// The form's accessible name as aria-labelledby gives it: the text of the elements it names, in its own root.
const formName = (v) => {
  const form = v.root().querySelector('form');
  const ids = form.getAttribute('aria-labelledby');
  if (!ids) return null;
  return ids
    .split(/\s+/)
    .map((id) => v.root().getElementById(id)?.textContent ?? '')
    .join(' ')
    .trim();
};

describe('Rocket Form: accessible name', () => {
  test('[PackComponent-FORM-A11Y-001] the default title names the form', async () => {
    const v = await mountPack('shadcn', 'Form');
    expect(formName(v)).toBe('Contact us');
  });

  test('[PackComponent-FORM-A11Y-002] the name follows a changed title', async () => {
    const v = await mountPack('shadcn', 'Form', { title: 'Sign up' });
    expect(formName(v)).toBe('Sign up');
    await v.update({ props: { title: 'Register' } });
    expect(formName(v)).toBe('Register');
  });

  test('[PackComponent-FORM-A11Y-003] with no title the form is not given a name', async () => {
    const v = await mountPack('shadcn', 'Form', { title: '' });
    expect(v.root().querySelector('form').hasAttribute('aria-labelledby')).toBe(false);
  });
});

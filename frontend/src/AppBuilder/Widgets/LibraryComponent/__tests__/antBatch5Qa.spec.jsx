import { act, waitFor } from '@testing-library/react';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack, settle } from './packMount';
import { ANT_PACK_CSS, copyWithPackCss, removeCopies } from './antPackCss';

installBrowserStubs();

// QA board "Pack Components Full QA", Ant Design. The pack's components, the inline SDK and the host renderer are the
// real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  removeCopies();
  document.body.innerHTML = '';
});

// The declarations pack.css gives a selector, read off its rules (jsdom matches no :focus-visible).
const rule = (selector) => {
  const style = document.createElement('style');
  style.textContent = ANT_PACK_CSS;
  document.head.appendChild(style);
  const found = [...style.sheet.cssRules].find((r) => r.selectorText === selector);
  style.remove();
  return found?.style;
};

// PKB-41: Primary color, Container background and Border color did nothing on a Descriptions. Container background
// fills its box, Border color draws the bordered lines (Ant's split colour) and Primary color its labels.
describe('Ant Design Descriptions: Styles', () => {
  const styles = { colorPrimary: '#ff0000', colorBgContainer: '#ffeeaa', colorBorder: '#0000ff' };

  test('[PackComponent-DESCRIPTIONS-001] Container background fills the box and Border color the lines', async () => {
    const v = await mountPack('antd', 'Descriptions', { bordered: true }, { styles });
    const root = v.root().querySelector('.tj-ant-desc');

    expect(root.style.backgroundColor).toMatch(/#ffeeaa|rgb\(255, 238, 170\)/);
    expect(root.style.getPropertyValue('--tj-ant-color-split')).toBe('#0000ff');
  });

  test('[PackComponent-DESCRIPTIONS-002] Primary color colours the labels, bordered or not', async () => {
    const v = await mountPack('antd', 'Descriptions', { bordered: true }, { styles });
    const copy = copyWithPackCss(v.root());

    expect(
      getComputedStyle(copy.querySelector('.ant-descriptions')).getPropertyValue('--ant-descriptions-label-color')
    ).toBe('var(--tj-ant-color-primary, var(--ant-color-text-tertiary))');
    // A bordered one colours its labels with Ant's secondary text, not the label colour: the rule is read as text, as
    // jsdom does not match its long child selector.
    const bordered = ANT_PACK_CSS.slice(
      ANT_PACK_CSS.indexOf('.tj-ant-desc .ant-descriptions.ant-descriptions-bordered')
    );
    expect(bordered.slice(0, bordered.indexOf('}'))).toContain(
      'color: var(--tj-ant-color-primary, var(--ant-color-text-secondary));'
    );
  });

  test('[PackComponent-DESCRIPTIONS-003] unset, the box has no colour of its own', async () => {
    const v = await mountPack('antd', 'Descriptions', { bordered: true });
    const root = v.root().querySelector('.tj-ant-desc');

    expect(root.style.backgroundColor).toBe('');
    expect(root.style.getPropertyValue('--tj-ant-color-split')).toBe('');
  });
});

// PF-009: the Hero eyebrow used the primary colour, 2.47:1 on the dark theme's tint. On the dark theme it takes the
// primary's lighter shade (3.6:1), as readable as the light theme's primary on its tint.
test('[PackComponent-HERO-001] the eyebrow takes the lighter primary on the dark theme', () => {
  expect(rule('.tj-ant-hero-eyebrow').color).toBe('var(--ant-color-primary-text)');
  expect(rule('.tj-ant-dark .tj-ant-hero-eyebrow').color).toBe('var(--ant-color-primary-text-hover)');
});

// PF-008, PF-022: initials were white on Ant's grey avatar (1.83:1) on Kanban cards and in the Chat. They are dark text
// on the primary tint.
describe('Ant Design avatar initials', () => {
  test('[PackComponent-AVATAR-010] read as text on the primary tint', () => {
    const initials = rule('.ant-avatar.tj-ant-initials');
    expect(initials.background).toBe('var(--ant-color-primary-bg)');
    expect(initials.color).toBe('var(--ant-color-text)');
  });

  test('[PackComponent-AVATAR-011] the Kanban owner and the Chat respondent use them', async () => {
    const kanban = await mountPack('antd', 'Kanban', {});
    const chat = await mountPack('antd', 'Chat', {});

    await waitFor(() => expect(kanban.root().querySelector('.ant-avatar.tj-ant-initials')).toBeTruthy());
    await waitFor(() => expect(chat.root().querySelector('.ant-avatar.tj-ant-initials')).toBeTruthy());
  });
});

// PF-023: the Chat's message box had only a placeholder, no accessible name.
test('[PackComponent-CHAT-010] the message box is named Message', async () => {
  const v = await mountPack('antd', 'Chat', {});

  await waitFor(() => expect(v.root().querySelector('textarea')).toBeTruthy());
  expect(v.root().querySelector('textarea').getAttribute('aria-label')).toBe('Message');
});

// PF-024: the Questionnaire takes focus (for its shortcut keys) with no visible ring.
test('[PackComponent-QUESTIONNAIRE-001] a keyboard focus ring shows on the questionnaire', () => {
  const ring = rule('.tj-ant-quiz:focus-visible');
  expect(ring.outline).toMatch(/2px solid/);
});

describe('Ant Design Phone Input', () => {
  const picker = (v) => v.root().querySelector('[role=combobox]');
  const shown = (v) => v.root().querySelector('.ant-select-selection-item')?.textContent;

  // PF-068: the country picker had no accessible name.
  test('[PackComponent-PHONE-010] the country picker is named Country', async () => {
    const v = await mountPack('antd', 'PhoneInput', {});

    expect(picker(v).getAttribute('aria-label')).toBe('Country');
  });

  // PF-067: a bound Default country that changed was ignored; the field stayed on the first country.
  test('[PackComponent-PHONE-011] a changed Default country moves an empty field to it', async () => {
    const v = await mountPack('antd', 'PhoneInput', { defaultCountry: 'US' });
    expect(v.exposed.country).toBe('US');

    await v.update({ props: { defaultCountry: 'IN' } });
    await settle();

    expect(v.exposed.country).toBe('IN');
    expect(shown(v)).toContain('+91');
  });

  test('[PackComponent-PHONE-012] a number already entered keeps its country', async () => {
    const v = await mountPack('antd', 'PhoneInput', { defaultCountry: 'US', value: '+14155550123' });

    await v.update({ props: { defaultCountry: 'IN', value: '+14155550123' } });
    await act(() => settle());

    expect(v.exposed.country).toBe('US');
  });
});

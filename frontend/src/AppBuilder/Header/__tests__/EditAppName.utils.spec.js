/**
 * @jest-environment node
 */

jest.mock('@/_helpers/utils', () => ({
  validateName: (name, _type, _emptyCheck, _showError, _special, _spaces, _reserved, _cases, maxLength) => {
    if (!name) return { status: false, errorMsg: 'App name cannot be empty' };
    if (name.length > maxLength) return { status: false, errorMsg: 'Maximum length has been reached.' };
    return { status: true };
  },
}));

const {
  APP_NAME_MAX_LENGTH,
  APP_NAME_VISIBLE_LENGTH,
  EDIT_ICON_REVEAL_CLASS,
  EDIT_APP_NAME_ICON_PROPS,
  INLINE_RENAME_ACTIONS_CLASS,
  INLINE_RENAME_ACTIONS_EXIT_CLASS,
  INLINE_RENAME_TRANSITION_MS,
  INLINE_RENAME_ACTION_CLASS,
  INLINE_RENAME_INPUT_CLASS,
  INLINE_RENAME_INPUT_STYLE,
  INLINE_RENAME_SAVE_COLOR_CLASS,
  INLINE_RENAME_TRIGGER_CLASS,
  getInlineNameCursorPosition,
  getInlineNameWidth,
  normalizeAppName,
  validateInlineAppName,
} = require('../EditAppName.utils');

describe('inline app rename helpers', () => {
  test('keeps the 100 character save limit', () => {
    expect(APP_NAME_MAX_LENGTH).toBe(100);
    expect(validateInlineAppName('a'.repeat(100))).toEqual({ errorMsg: '', isAtLimit: true });
    expect(validateInlineAppName('a'.repeat(101))).toEqual({
      errorMsg: 'Maximum length has been reached.',
      isAtLimit: true,
    });
  });

  test('keeps the modal validation rules for empty and otherwise valid names', () => {
    expect(validateInlineAppName('   ').errorMsg).toBeTruthy();
    expect(validateInlineAppName('Revenue dashboard')).toEqual({ errorMsg: '', isAtLimit: false });
  });

  test('normalizes whitespace before save', () => {
    expect(normalizeAppName('  Revenue   dashboard  ')).toBe('Revenue dashboard');
  });

  test('lets the input grow with its value and visually clamps it at 50 characters', () => {
    expect(APP_NAME_VISIBLE_LENGTH).toBe(50);
    expect(getInlineNameWidth('App')).toBe('8ch');
    expect(getInlineNameWidth('Revenue dashboard')).toBe('18ch');
    expect(getInlineNameWidth('a'.repeat(60))).toBe('50ch');
  });

  test('uses one compact visual treatment for save and cancel actions', () => {
    expect(INLINE_RENAME_ACTION_CLASS).toContain('tw-h-7');
    expect(INLINE_RENAME_ACTION_CLASS).toContain('tw-w-[18px]');
    expect(INLINE_RENAME_ACTION_CLASS).toContain('tw-border-0');
    expect(INLINE_RENAME_ACTION_CLASS).toContain('tw-appearance-none');
    expect(INLINE_RENAME_ACTION_CLASS).toContain('hover:tw-scale-110');
    expect(INLINE_RENAME_ACTION_CLASS).toContain('disabled:tw-opacity-70');
  });

  test('uses the darker success color for save', () => {
    expect(INLINE_RENAME_SAVE_COLOR_CLASS).toBe('tw-text-[var(--green12)]');
  });

  test('reveals the edit icon smoothly and places the editing caret at the end', () => {
    expect(EDIT_ICON_REVEAL_CLASS).toContain('tw-max-w-0');
    expect(EDIT_ICON_REVEAL_CLASS).toContain('group-hover:tw-max-w-4');
    expect(EDIT_ICON_REVEAL_CLASS).toContain('tw-transition-all');
    expect(getInlineNameCursorPosition('Revenue dashboard')).toBe(17);
  });

  test('matches the edit glyph to the header icon scale and weight', () => {
    expect(EDIT_APP_NAME_ICON_PROPS).toEqual({ size: 15, strokeWidth: 1.8 });
  });

  test('keeps the editable name visually plain while the action icons animate into the pencil slot', () => {
    expect(INLINE_RENAME_INPUT_CLASS).toContain('tw-border-0');
    expect(INLINE_RENAME_INPUT_CLASS).toContain('tw-bg-transparent');
    expect(INLINE_RENAME_INPUT_CLASS).toContain('focus:tw-outline-none');
    expect(INLINE_RENAME_ACTIONS_CLASS).toContain('app-name-inline-actions');
  });

  test('keeps the name trigger borderless across interactive states', () => {
    expect(INLINE_RENAME_TRIGGER_CLASS).toContain('app-name-inline-trigger');
    expect(INLINE_RENAME_TRIGGER_CLASS).toContain('tw-border-0');
    expect(INLINE_RENAME_TRIGGER_CLASS).toContain('tw-bg-transparent');
  });

  test('uses a matching exit phase before returning to the pencil', () => {
    expect(INLINE_RENAME_ACTIONS_EXIT_CLASS).toBe('app-name-inline-actions--exit');
    expect(INLINE_RENAME_TRANSITION_MS).toBe(180);
  });

  test('sizes the editable name from rendered content instead of character estimates', () => {
    expect(INLINE_RENAME_INPUT_STYLE).toEqual({
      fieldSizing: 'content',
      width: 'auto',
      minWidth: '8ch',
      maxWidth: '50ch',
    });
  });
});

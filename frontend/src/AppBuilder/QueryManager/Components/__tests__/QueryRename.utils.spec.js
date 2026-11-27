/**
 * @jest-environment node
 */

const {
  QUERY_NAME_VISIBLE_LENGTH,
  getInlineQueryNameCursorPosition,
  getInlineQueryNameStyle,
  getQueryDocumentationPresentation,
  normalizeQueryName,
  validateInlineQueryName,
} = require('../QueryRename.utils');

describe('inline query rename helpers', () => {
  // Break this catches: the query editor reintroduces blur-to-save or selects the full name instead of placing the caret last.
  test('matches the app rename cursor and content-sized input behavior', () => {
    expect(getInlineQueryNameCursorPosition('customerOrders')).toBe(14);
    expect(QUERY_NAME_VISIBLE_LENGTH).toBe(25);
    expect(getInlineQueryNameStyle()).toEqual({
      fieldSizing: 'content',
      maxWidth: '25ch',
      minWidth: '8ch',
      width: 'auto',
    });
  });

  // Break this catches: the documentation action drifts out of the shared panel header actions.
  test('places the documentation action in the panel header actions', () => {
    expect(getQueryDocumentationPresentation()).toEqual({
      placement: 'header-actions',
      tooltipClassName: 'query-documentation-tooltip',
      tooltipPlacement: 'bottom',
    });
  });

  // Break this catches: query renaming silently changes the existing no-space/no-ampersand naming contract.
  test('preserves query normalization and validation without inventing a backend length cap', () => {
    expect(normalizeQueryName(' customer orders & totals ')).toBe('customerorderstotals');
    expect(validateInlineQueryName('   ')).toEqual({ errorMsg: 'Query name cannot be empty' });
    expect(validateInlineQueryName('a'.repeat(1000))).toEqual({ errorMsg: '' });
  });
});

export const QUERY_NAME_VISIBLE_LENGTH = 25;

export const normalizeQueryName = (name = '') => name.replace(/[ \t&]/g, '');

export const validateInlineQueryName = (name = '') => ({
  errorMsg: normalizeQueryName(name).length === 0 ? 'Query name cannot be empty' : '',
});

export const getInlineQueryNameCursorPosition = (name = '') => name.length;

export const getInlineQueryNameStyle = () => ({
  fieldSizing: 'content',
  width: 'auto',
  minWidth: '8ch',
  maxWidth: `${QUERY_NAME_VISIBLE_LENGTH}ch`,
});

export const getQueryDocumentationPresentation = () => ({
  placement: 'inline-after-name',
  tooltipClassName: 'query-documentation-tooltip',
  tooltipPlacement: 'bottom',
});

import { validateName } from '@/_helpers/utils';

export const APP_NAME_VISIBLE_LENGTH = 50;
export const APP_NAME_MAX_LENGTH = 100;
const APP_NAME_MIN_WIDTH = 8;

export const EDIT_APP_NAME_ICON_PROPS = { size: 15, strokeWidth: 1.8 };

export const INLINE_RENAME_ACTION_CLASS =
  'tw-inline-flex tw-h-7 tw-w-[18px] tw-shrink-0 tw-appearance-none tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-p-0 tw-outline-none tw-transition-transform tw-duration-150 hover:tw-scale-110 disabled:tw-cursor-not-allowed disabled:tw-opacity-70 disabled:hover:tw-scale-100';

export const INLINE_RENAME_SAVE_COLOR_CLASS = 'tw-text-[var(--green12)]';

export const EDIT_ICON_REVEAL_CLASS =
  'tw-inline-flex tw-max-w-0 tw-shrink-0 tw-items-center tw-overflow-hidden tw-opacity-0 tw-transition-all tw-duration-200 tw-ease-out group-hover:tw-max-w-4 group-hover:tw-opacity-100';

export const INLINE_RENAME_INPUT_CLASS =
  'app-name-inline-input tw-h-8 tw-min-w-0 tw-max-w-[50ch] tw-appearance-none tw-border-0 tw-bg-transparent tw-px-1 tw-text-[13px] tw-font-medium tw-leading-[18px] tw-text-[var(--text-default)] tw-shadow-none tw-outline-none focus:tw-outline-none focus:tw-shadow-none';

export const INLINE_RENAME_INPUT_STYLE = {
  fieldSizing: 'content',
  width: 'auto',
  minWidth: '8ch',
  maxWidth: '50ch',
};

export const INLINE_RENAME_ACTIONS_CLASS =
  'app-name-inline-actions tw-flex tw-shrink-0 tw-items-center tw-overflow-hidden';
export const INLINE_RENAME_ACTIONS_EXIT_CLASS = 'app-name-inline-actions--exit';
export const INLINE_RENAME_TRANSITION_MS = 180;

export const INLINE_RENAME_TRIGGER_CLASS =
  'app-name-inline-trigger edit-app-name-button tw-group tw-relative tw-flex tw-h-8 tw-min-w-0 tw-max-w-full tw-appearance-none tw-items-center tw-justify-start tw-gap-1 tw-border-0 tw-bg-transparent tw-px-1 tw-font-medium tw-shadow-none tw-outline-none';

export const normalizeAppName = (name = '') => name.trim().replace(/\s+/g, ' ');

export const getInlineNameCursorPosition = (name = '') => name.length;

export const getInlineNameWidth = (name = '') =>
  `${Math.min(Math.max(name.length + 1, APP_NAME_MIN_WIDTH), APP_NAME_VISIBLE_LENGTH)}ch`;

export const validateInlineAppName = (name = '') => {
  const trimmedName = name.trim();
  const validation = validateName(trimmedName, 'App', false, false, true, true, false, false, APP_NAME_MAX_LENGTH);

  return {
    errorMsg: validation?.errorMsg || '',
    isAtLimit: name.length >= APP_NAME_MAX_LENGTH,
  };
};

// shadcn/ui pack (experiment): style variables and loading looks of the display widgets (see shadcnLook.js and
// Shell's LOADING_LOOK). Style keys match WidgetManager/shadcnSource.display.js; ShadDisplay.jsx reads the variables.
import { px } from '../kanbanLook';

const ACCENT = ['--sc-primary', '--sc-ring'];

export const LOOKS = {
  ShadImage: [
    ['borderRadius', '--lk-radius', px],
    ['borderColor', '--lk-border'],
    ['backgroundColor', '--lk-bg'],
    ['fallbackTextColor', '--lk-fg'],
    ['captionColor', '--lk-caption'],
  ],
  ShadIcon: [
    ['iconColor', '--lk-icon'],
    ['chipColor', '--lk-chip'],
    ['chipRadius', '--lk-radius', px],
  ],
  ShadLink: [
    ['textColor', '--lk-fg'],
    ['hoverColor', '--lk-hover'],
  ],
  ShadTags: [
    ['backgroundColor', '--lk-bg'],
    ['textColor', '--lk-fg'],
    ['borderColor', '--lk-border'],
    ['borderRadius', '--lk-radius', px],
  ],
  ShadCircularProgress: [
    ['barColor', '--sc-primary'],
    ['trackColor', '--lk-track'],
    ['textColor', '--lk-fg'],
    ['labelColor', '--lk-label'],
  ],
  ShadSpinner: [
    ['spinnerColor', '--sc-primary'],
    ['trackColor', '--lk-track'],
    ['labelColor', '--lk-label'],
  ],
  ShadKeyValue: [
    ['labelColor', '--lk-label'],
    ['valueColor', '--lk-fg'],
    ['dividerColor', '--lk-border'],
    ['linkColor', '--lk-link'],
  ],
  ShadTimeline: [
    ['markerColor', '--lk-marker'],
    ['lineColor', '--lk-line'],
    ['titleColor', '--lk-title'],
    ['descriptionColor', '--lk-fg'],
    ['timeColor', '--lk-time'],
  ],
  ShadSteps: [
    ['completedAccent', ACCENT],
    ['incompletedAccent', '--lk-idle'],
    ['completedLabel', '--lk-done-label'],
    ['currentStepLabel', '--lk-current-label'],
    ['incompletedLabel', '--lk-idle-label'],
    ['descriptionColor', '--lk-help'],
  ],
  ShadPagination: [
    ['textColor', '--lk-fg'],
    ['hoverBackgroundColor', '--lk-hover'],
    ['activeBackgroundColor', '--lk-on-bg'],
    ['activeTextColor', '--lk-on-fg'],
    ['activeBorderColor', '--lk-on-border'],
    ['borderRadius', '--lk-radius', px],
  ],
};

// Loading looks: media and lists become skeletons in their own shape ('own': ShadDisplay.jsx draws it); the pager
// stays in place, disabled, with a spinner; a spinner is its own loading state.
export const LOADING = {
  ShadImage: 'block',
  ShadIcon: 'own',
  ShadLink: 'line',
  ShadTags: 'own',
  ShadCircularProgress: 'own',
  ShadSpinner: 'own',
  ShadKeyValue: 'own',
  ShadTimeline: 'own',
  ShadSteps: 'own',
  ShadPagination: 'own',
};

// shadcn/ui pack: style variables and loading looks of the page sections (see shadcnLook.js and Shell's LOADING_LOOK).
// Style keys match WidgetManager/shadcnSource.sections.js; ShadSections.jsx reads the variables.
import { px } from '../kanbanLook';
import { fontStack } from '../typeLook';

export const LOOKS = {
  ShadHero: [
    ['accentColor', '--lk-accent'],
    ['backgroundColor', '--lk-bg'],
    ['titleColor', '--lk-title'],
    ['textColor', '--lk-fg'],
    ['borderRadius', '--lk-radius', px],
    ['titleFontFamily', '--lk-title-font', fontStack],
  ],
  ShadCardGrid: [
    ['cardBackground', '--lk-bg'],
    ['borderColor', '--lk-border'],
    ['titleColor', '--lk-title'],
    ['textColor', '--lk-fg'],
    ['accentColor', '--lk-accent'],
    ['borderRadius', '--lk-radius', px],
    ['titleFontFamily', '--lk-title-font', fontStack],
  ],
};

// The hero draws a skeleton of its title and lines; the grid skeletons its cards (ShadSections.jsx).
export const LOADING = {
  ShadHero: 'own',
  ShadCardGrid: 'own',
};

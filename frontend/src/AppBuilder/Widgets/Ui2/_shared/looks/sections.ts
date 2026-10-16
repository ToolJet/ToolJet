// ToolJet UI 2.0: style variables and loading looks of the page sections (see shadcnLook.ts and Shell's LOADING_LOOK).
// Style keys match WidgetManager/widgets/shad*.js; the section widgets read the variables.
import { px } from '@/AppBuilder/Widgets/Ui2/_shared/looks/kanbanLook';
import { fontStack } from '@/AppBuilder/Widgets/Ui2/_shared/looks/typeLook';
import type { LoadingMap, LookMap } from '@/AppBuilder/Widgets/Ui2/_shared/types';

export const LOOKS: LookMap = {
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
  ShadRecordList: [
    ['backgroundColor', '--lk-bg'],
    ['borderColor', '--lk-border'],
    ['titleColor', '--lk-title'],
    ['textColor', '--lk-fg'],
    ['accentColor', '--lk-accent'],
    ['borderRadius', '--lk-radius', px],
    ['titleFontFamily', '--lk-title-font', fontStack],
  ],
  ShadProgressList: [
    ['backgroundColor', '--lk-bg'],
    ['borderColor', '--lk-border'],
    ['titleColor', '--lk-title'],
    ['textColor', '--lk-fg'],
    ['accentColor', '--lk-accent'],
    ['trackColor', '--lk-track'],
    ['borderRadius', '--lk-radius', px],
    ['titleFontFamily', '--lk-title-font', fontStack],
  ],
  ShadSummaryStrip: [
    ['backgroundColor', '--lk-bg'],
    ['borderColor', '--lk-border'],
    ['labelColor', '--lk-fg'],
    ['valueColor', '--lk-title'],
    ['positiveColor', '--lk-pos'],
    ['negativeColor', '--lk-neg'],
    ['borderRadius', '--lk-radius', px],
    ['valueFontFamily', '--lk-title-font', fontStack],
  ],
};

// The hero draws a skeleton of its title and lines; the grid, the lists and the strip skeleton their cards, rows and
// figures (the section widgets).
export const LOADING: LoadingMap = {
  ShadHero: 'own',
  ShadCardGrid: 'own',
  ShadRecordList: 'own',
  ShadProgressList: 'own',
  ShadSummaryStrip: 'own',
};

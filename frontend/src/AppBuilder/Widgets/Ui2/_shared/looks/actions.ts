// ToolJet UI 2.0: style variables and loading looks of the actions widgets (see shadcnLook.ts and
// Shell's LOADING_LOOK). Style keys match WidgetManager/widgets/shad*.js; the action widgets read the variables.
import type { LoadingMap, LookMap } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { px } from '@/AppBuilder/Widgets/Ui2/_shared/values';

export const LOOKS: LookMap = {
  ShadDropdownMenu: [
    ['backgroundColor', '--lk-bg'],
    ['hoverBackgroundColor', '--lk-hover'],
    ['textColor', '--lk-fg'],
    ['borderColor', '--lk-border'],
    ['borderRadius', '--lk-radius', px],
    ['menuBackgroundColor', '--lk-menu-bg'],
    ['menuBorderColor', '--lk-menu-border'],
    ['itemTextColor', '--lk-item-fg'],
    ['itemHoverBackgroundColor', '--lk-item-hover'],
    ['itemHoverTextColor', '--lk-item-hover-fg'],
    ['descriptionColor', '--lk-desc'],
    ['iconColor', '--lk-icon'],
    ['destructiveColor', '--lk-destructive'],
    ['menuRadius', '--lk-menu-radius', px],
    ['menuWidth', '--lk-menu-width', px],
  ],
  ShadButtonGroup: [
    ['backgroundColor', '--lk-bg'],
    ['hoverBackgroundColor', '--lk-hover'],
    ['textColor', '--lk-fg'],
    ['borderColor', '--lk-border'],
    ['selectedBackgroundColor', '--lk-on-bg'],
    ['selectedTextColor', '--lk-on-fg'],
    ['iconColor', '--lk-icon'],
    ['labelColor', '--lk-label'],
    ['borderRadius', '--lk-radius', px],
  ],
  ShadNavigation: [
    ['backgroundColor', '--lk-bg'],
    ['textColor', '--lk-fg'],
    ['iconColor', '--lk-icon'],
    ['hoverBackgroundColor', '--lk-hover'],
    ['activeBackgroundColor', '--lk-active-bg'],
    ['activeTextColor', '--lk-active-fg'],
    ['indicatorColor', '--lk-indicator'],
    ['badgeBackgroundColor', '--lk-badge-bg'],
    ['badgeTextColor', '--lk-badge-fg'],
    ['groupLabelColor', '--lk-group'],
    ['separatorColor', '--lk-sep'],
    ['itemRadius', '--lk-radius', px],
  ],
  ShadCalendar: [
    ['backgroundColor', '--lk-bg'],
    ['borderColor', '--lk-border'],
    ['textColor', '--lk-fg'],
    ['headerTextColor', '--lk-title'],
    ['mutedTextColor', '--lk-muted'],
    ['accentColor', ['--sc-primary', '--sc-ring']],
    ['selectedTextColor', '--sc-primary-foreground'],
    ['rangeBackgroundColor', '--lk-range'],
    ['todayBackgroundColor', '--lk-today'],
    ['hoverBackgroundColor', '--lk-hover'],
    ['markerColor', '--lk-marker'],
    ['borderRadius', '--lk-radius', px],
    ['cellSize', '--lk-cell', px],
  ],
  ShadCarousel: [
    ['slideBackgroundColor', '--lk-slide-bg'],
    ['arrowBackgroundColor', '--lk-arrow-bg'],
    ['arrowColor', '--lk-arrow-fg'],
    ['dotColor', '--lk-dot'],
    ['activeDotColor', '--lk-dot-active'],
    ['captionBackgroundColor', '--lk-caption-bg'],
    ['captionTextColor', '--lk-caption-fg'],
    ['titleColor', '--lk-title'],
    ['descriptionColor', '--lk-desc'],
    ['borderRadius', '--lk-radius', px],
    ['gap', '--lk-gap', px],
  ],
};

// The trigger and the button group draw their own spinner (a button's label gives way to it); the navigation draws
// skeleton items in its own shape; the calendar and carousel become a skeleton block.
export const LOADING: LoadingMap = {
  ShadDropdownMenu: 'own',
  ShadButtonGroup: 'own',
  ShadNavigation: 'own',
  ShadCalendar: 'block',
  ShadCarousel: 'block',
};

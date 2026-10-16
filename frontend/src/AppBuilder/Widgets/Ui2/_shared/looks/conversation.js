// ToolJet UI 2.0 pack: style variables and loading looks of the conversation widgets (see shadcnLook.js and Shell's
// LOADING_LOOK). Style keys match WidgetManager/widgets/shad*.js; ShadChat.jsx and ShadQuestionnaire.jsx
// read the variables. The Chat keeps the native Chat's style keys.
import { px } from '@/AppBuilder/Widgets/Ui2/_shared/looks/kanbanLook';
import { fontStack } from '@/AppBuilder/Widgets/Ui2/_shared/looks/typeLook';

export const LOOKS = {
  ShadChat: [
    ['containerBackgroundColor', '--lk-bg'],
    ['borderColorContainer', '--lk-border'],
    ['borderRadius', '--lk-radius', px],
    ['accentColorField', '--lk-accent'],
    ['responseBubbleColor', '--lk-bubble'],
    ['name', '--lk-name'],
    ['message', '--lk-fg'],
    ['timestamp', '--lk-muted'],
    ['backgroundColorField', '--lk-field-bg'],
    ['borderColorField', '--lk-field-border'],
    ['textColorField', '--lk-field-fg'],
    ['sendIconColorField', '--lk-send'],
  ],
  ShadQuestionnaire: [
    ['accentColor', '--lk-accent'],
    ['backgroundColor', '--lk-bg'],
    ['borderColor', '--lk-border'],
    ['titleColor', '--lk-title'],
    ['textColor', '--lk-fg'],
    ['borderRadius', '--lk-radius', px],
    ['titleFontFamily', '--lk-title-font', fontStack],
  ],
};

// Both show the pack's spinner box while loading (the chat's History loading state draws skeleton message rows).
export const LOADING = {};

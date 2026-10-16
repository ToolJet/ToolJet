// ToolJet UI 2.0 pack: style variables and loading look of the Schedule (see shadcnLook.js and Shell's LOADING_LOOK).
// Style keys match WidgetManager/widgets/shad*.js; ShadSchedule.jsx reads the variables.
import { px } from '@/AppBuilder/Widgets/Ui2/_shared/looks/kanbanLook';
import type { LoadingMap, LookMap } from '@/AppBuilder/Widgets/Ui2/_shared/types';

export const LOOKS: LookMap = {
  ShadSchedule: [
    ['backgroundColor', '--lk-bg'],
    ['borderColor', '--lk-border'],
    ['textColor', '--lk-fg'],
    ['accentColor', '--lk-accent'],
    ['nowColor', '--lk-now'],
    ['borderRadius', '--lk-radius', px],
  ],
};

// The schedule draws a skeleton of its header and rows (ShadSchedule.jsx).
export const LOADING: LoadingMap = { ShadSchedule: 'own' };

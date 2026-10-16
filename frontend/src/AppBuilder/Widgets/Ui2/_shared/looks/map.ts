// ToolJet UI 2.0 pack: style variables and loading look of the Map (see shadcnLook.js and Shell's LOADING_LOOK).
// Style keys match WidgetManager/widgets/shad*.js; ShadMap.jsx and the .sc-map rules in shadcn.scss read them.
import { px } from '@/AppBuilder/Widgets/Ui2/_shared/looks/kanbanLook';
import type { LoadingMap, LookMap } from '@/AppBuilder/Widgets/Ui2/_shared/types';

export const LOOKS: LookMap = {
  ShadMap: [
    ['backgroundColor', '--lk-bg'],
    ['borderColor', '--lk-border'],
    ['accentColor', '--lk-accent'],
    ['clusterColor', '--lk-cluster'],
    ['borderRadius', '--lk-radius', px],
  ],
};

// The map stays in place under a spinner while it loads (ShadMap.jsx).
export const LOADING: LoadingMap = { ShadMap: 'own' };

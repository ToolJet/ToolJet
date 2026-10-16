// shadcn/ui pack (experiment): style-variable maps and loading looks of the widget groups kept in their own modules.
import * as actions from '@/AppBuilder/Widgets/Ui2/_shared/looks/actions';
import * as charts from '@/AppBuilder/Widgets/Ui2/_shared/looks/charts';
import * as conversation from '@/AppBuilder/Widgets/Ui2/_shared/looks/conversation';
import * as display from '@/AppBuilder/Widgets/Ui2/_shared/looks/display';
import * as inputs from '@/AppBuilder/Widgets/Ui2/_shared/looks/inputs';
import * as map from '@/AppBuilder/Widgets/Ui2/_shared/looks/map';
import * as pickers from '@/AppBuilder/Widgets/Ui2/_shared/looks/pickers';
import * as schedule from '@/AppBuilder/Widgets/Ui2/_shared/looks/schedule';
import * as sections from '@/AppBuilder/Widgets/Ui2/_shared/looks/sections';

const groups = [inputs, pickers, display, actions, charts, sections, conversation, map, schedule];
export const GROUP_LOOKS = Object.assign({}, ...groups.map((g) => g.LOOKS));
export const GROUP_LOADING = Object.assign({}, ...groups.map((g) => g.LOADING));

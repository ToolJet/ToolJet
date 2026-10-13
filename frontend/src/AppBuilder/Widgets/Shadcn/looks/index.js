// shadcn/ui pack (experiment): style-variable maps and loading looks of the widget groups kept in their own modules.
import * as actions from './actions';
import * as charts from './charts';
import * as conversation from './conversation';
import * as display from './display';
import * as inputs from './inputs';
import * as map from './map';
import * as pickers from './pickers';
import * as schedule from './schedule';
import * as sections from './sections';

const groups = [inputs, pickers, display, actions, charts, sections, conversation, map, schedule];
export const GROUP_LOOKS = Object.assign({}, ...groups.map((g) => g.LOOKS));
export const GROUP_LOADING = Object.assign({}, ...groups.map((g) => g.LOADING));

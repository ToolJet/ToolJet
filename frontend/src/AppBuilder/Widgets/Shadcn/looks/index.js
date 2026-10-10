// shadcn/ui pack (experiment): style-variable maps and loading looks of the widget groups kept in their own modules.
import * as actions from './actions';
import * as charts from './charts';
import * as display from './display';
import * as inputs from './inputs';
import * as pickers from './pickers';

const groups = [inputs, pickers, display, actions, charts];
export const GROUP_LOOKS = Object.assign({}, ...groups.map((g) => g.LOOKS));
export const GROUP_LOADING = Object.assign({}, ...groups.map((g) => g.LOADING));

// The native Table's chip helpers (NewTable/_utils/chipTone.js), typed: that module is JavaScript.
import * as chips from '@/AppBuilder/Widgets/NewTable/_utils/chipTone';

/** The tone a chip takes from its value's words ('Paid' success, 'Overdue' danger), '' for none. */
export const chipTone = chips.chipTone as (value: unknown) => string;
/** The chip's text for a value. */
export const chipLabel = chips.chipLabel as (value: unknown) => string;

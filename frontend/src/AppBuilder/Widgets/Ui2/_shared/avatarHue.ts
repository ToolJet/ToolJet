// The native Table's avatar helpers (NewTable/_utils/avatarHue.js), typed: that module is JavaScript.
import * as avatars from '@/AppBuilder/Widgets/NewTable/_utils/avatarHue';

/** A stable hue (0-359) for a name, so a person keeps one avatar colour. */
export const avatarHue = avatars.avatarHue as (name: unknown) => number;
/** Whether a value names nobody (empty, 'Unassigned', a dash). */
export const isNobody = avatars.isNobody as (value: unknown) => boolean;
/** Two initials, of the first and the last word with a letter ("Yusuf & Leyla Demir" reads YD). */
export const initials = avatars.initials as (name: unknown) => string;

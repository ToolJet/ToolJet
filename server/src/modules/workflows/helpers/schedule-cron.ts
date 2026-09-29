import * as moment from 'moment';
import { parseExpression, CronExpression } from 'cron-parser';

/**
 * Turning a stored schedule into "when does this actually fire" — the single source of truth for
 * both the scheduler that registers the job and the dashboard that predicts it.
 *
 * This logic was previously private to `WorkflowSchedulerService`
 * (`#convertWorkflowScheduleSettingsToCronString`), which meant anything else that needed to know
 * a schedule's cadence had to reimplement it. Two implementations of "when does this fire" drift,
 * and the drift is invisible: the dashboard would confidently display a time that is not the time
 * the job runs. So it lives here, as pure functions, and the scheduler calls it too.
 *
 * Behaviour is preserved exactly, quirks included — see `hourOffset`.
 */

/** The stored shape: `workflow_schedules.type` plus its `details` jsonb. */
export type ScheduleShape = { type: string; details: Record<string, any> };

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * `hours + minutes / 60`, carried over verbatim from the scheduler.
 *
 * For a whole hour this is the hour. For anything else it is a fraction — "8:30 AM" becomes 8.5,
 * and `0 8.5 * * *` is not valid cron. The scheduler has always produced this and rejects it at
 * registration (`isValidCron`), so such a schedule never runs at all. Reproducing the quirk keeps
 * this helper honest: the panel shows the schedule as unresolvable rather than rounding to 8:00
 * and promising a run that will never happen. Changing it would change when live schedules fire.
 */
function hourOffset(timeString: string): number {
  const time = moment(timeString, 'h:mm A');
  return time.hours() + time.minutes() / 60;
}

/**
 * The schedule's cron expression, or null when it cannot be resolved.
 *
 * Null rather than a throw: a single unrecognised schedule must not fail the whole listing.
 */
export function scheduleToCron(schedule: ScheduleShape): string | null {
  const details = schedule?.details ?? {};

  if (schedule?.type === 'cron') {
    const { minute, hours, dayOfMonth, month, dayOfWeek } = details;
    if ([minute, hours, dayOfMonth, month, dayOfWeek].some((field) => field === undefined || field === null)) {
      return null;
    }
    return `${minute} ${hours} ${dayOfMonth} ${month} ${dayOfWeek}`;
  }

  switch (details.frequency) {
    case 'minute':
      return '* * * * *';
    case 'hour':
      return `${details.minutes} * * * *`;
    case 'day':
      return `0 ${hourOffset(details.hour)} * * *`;
    case 'week':
      // `moment().day('Monday').day()` resolves a day name to its index.
      return `0 ${hourOffset(details.hour)} * * ${moment().day(details.day).day()}`;
    case 'month':
      return `0 ${hourOffset(details.hour)} ${details.date} * *`;
    default:
      return null;
  }
}

/** The cadence in words, for a reader who should not have to parse cron. */
export function describeCadence(schedule: ScheduleShape): string {
  const details = schedule?.details ?? {};

  // A cron schedule was authored as an expression, so the expression is the thing its author
  // recognises. Inventing prose for arbitrary cron is a losing game.
  if (schedule?.type === 'cron') {
    return scheduleToCron(schedule) ?? 'Unknown schedule';
  }

  switch (details.frequency) {
    case 'minute':
      return 'Every minute';
    case 'hour':
      return `Hourly at :${String(details.minutes).padStart(2, '0')}`;
    case 'day':
      return `Daily at ${details.hour}`;
    case 'week':
      return `Weekly on ${details.day} at ${details.hour}`;
    case 'month':
      return `Monthly on day ${details.date} at ${details.hour}`;
    default:
      return 'Unknown schedule';
  }
}

/**
 * The next `count` fire times, resolved in the schedule's own timezone.
 *
 * Returns an empty array for anything unusable — an invalid expression (see `hourOffset`), a
 * missing one, or a timezone cron-parser rejects (BullMQ rejects it too, so the schedule never
 * fires). The caller is rendering a panel: one bad row should cost that row, not the request.
 */
export function nextRuns(cron: string | null, timezone: string, count: number, from: Date = new Date()): Date[] {
  if (!cron) return [];

  // `CronExpression` (not `ReturnType<typeof parseExpression>`): the function is generic over
  // `IsIterable`, and ReturnType instantiates that as the constraint `boolean` rather than its
  // `false` default, which widens `next()` to a union that does not have `toDate`.
  let iterator: CronExpression;
  try {
    iterator = parseExpression(cron, { currentDate: from, tz: timezone || 'UTC' });
  } catch {
    return [];
  }

  const runs: Date[] = [];
  try {
    for (let index = 0; index < count; index += 1) {
      runs.push(iterator.next().toDate());
    }
  } catch {
    // A finite expression can run out before `count` — return what it did yield.
  }
  return runs;
}

export { DAY_NAMES };

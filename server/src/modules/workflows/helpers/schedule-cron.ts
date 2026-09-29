import * as moment from 'moment';
import { parseExpression, CronExpression } from 'cron-parser';

export type ScheduleShape = { type: string; details: Record<string, any> };

/** Non-:00 times give a fractional hour and invalid cron; do not round, it changes live fire times. */
function hourOffset(timeString: string): number {
  const time = moment(timeString, 'h:mm A');
  return time.hours() + time.minutes() / 60;
}

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

/** Empty for an unusable expression or timezone: BullMQ rejects both, so the schedule never fires. */
export function nextRuns(cron: string | null, timezone: string, count: number, from: Date = new Date()): Date[] {
  if (!cron) return [];

  // CronExpression, not ReturnType<typeof parseExpression>: the generic widens next() and loses toDate.
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

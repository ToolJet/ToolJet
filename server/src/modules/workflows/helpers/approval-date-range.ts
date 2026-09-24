/**
 * Turn the approvals list's `from` / `to` query params into the instants the repository compares
 * `created_at` against (`created_at >= from`, `created_at <= to`).
 *
 * The problem this exists to solve: `<input type="date">` and every other date-only producer emit
 * `YYYY-MM-DD`, which `new Date(...)` reads as **midnight UTC**. Used as `to`, that excludes the
 * entire day the user picked — "to today" returns nothing created today, silently. The bound is a
 * half-open interval masquerading as a closed one.
 *
 * So a date-only value is treated as naming a whole day and is widened to that day's edge:
 * `from` to its first instant, `to` to its last. A value that carries a time is an instant the
 * caller chose deliberately and is passed through untouched.
 *
 * **Timezone.** A date-only string carries no offset, and HTTP gives the server no reliable way to
 * learn the caller's, so a bare date is anchored to UTC here — the one choice that is stable,
 * documented and identical for every consumer of this endpoint. Callers that need their own
 * timezone say so by sending a full ISO timestamp with an offset, which this passes straight
 * through; the approvals page does exactly that (`frontend/src/_services/workflow_approvals.service.js`),
 * converting the picker's local day into local-midnight / local-end-of-day instants before it
 * sends them. Widening here is therefore the floor for any API consumer, not the page's mechanism.
 */

/** `YYYY-MM-DD` with nothing after it — the only form that gets widened. */
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function parse(value: string | undefined, dayEdge: 'start' | 'end'): Date | undefined {
  if (!value) return undefined;
  const iso = DATE_ONLY.test(value) ? `${value}${dayEdge === 'start' ? 'T00:00:00.000Z' : 'T23:59:59.999Z'}` : value;
  const parsed = new Date(iso);
  // `@IsDateString()` on ListApprovalsDto already rejects unparseable input with a 400, so this is
  // belt-and-braces: an `Invalid Date` reaching TypeORM becomes a `NULL` comparison that drops
  // every row, which would look like "the filter works and matched nothing".
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

/** Lower bound. A bare `YYYY-MM-DD` becomes that day's first instant (UTC). */
export function parseApprovalRangeStart(value?: string): Date | undefined {
  return parse(value, 'start');
}

/** Upper bound. A bare `YYYY-MM-DD` becomes that day's last instant (UTC), so the day is included. */
export function parseApprovalRangeEnd(value?: string): Date | undefined {
  return parse(value, 'end');
}

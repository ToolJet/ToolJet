# DateTimePicker — Rocket Design Spec
<!-- figma: https://www.figma.com/design/XQdM9x8x9YHcj1lUK8abUG?node-id=12105-577 (_/helpers/datepicker/panel) -->
<!-- synced: 2026-11-19 -->

## Overview

Date, time or date-time field. A Rocket `Input`-looking trigger (32px) opens a panel in a Rocket `Popover`. No dependency: the calendar math is in `dateUtils.ts` on plain `Date`.

The value is a wall-clock `Date`, read and built with local getters. Time zones are the caller's job.

## Parts

| Part | File | Role |
|---|---|---|
| `DatePickerCell` | `DatePickerCell.tsx` | 28x28 day or time option. Variants `default` / `today` / `outside`; states rest, hover, pressed, selected, focus, disabled |
| `DatePickerCalendar` | `DatePickerCalendar.tsx` | Month header (ghost medium icon buttons), weekday row, always six weeks |
| `DatePickerTimeList` | `DatePickerTimeList.tsx` | Hour 01-12, Minute (step 5), Period AM/PM; three 48x224 scrolling listboxes |
| `DatePickerPanel` | `DatePickerPanel.tsx` | The surface. `type`: `date` (240 wide), `time` (240), `date-time` (400, Cancel / Apply footer) |
| `DateTimePicker` | `DateTimePicker.tsx` | The field + Popover |

## Props

`DateTimePicker`

| Prop | Type | Default |
|---|---|---|
| value | `Date \| null` | required |
| onChange | `(date: Date \| null) => void` | required |
| type | `'date' \| 'time' \| 'date-time'` | `'date'` |
| minDate / maxDate | `Date \| null` (day-level for days; instant-level for the time part) | — |
| placeholder | string | "Select date" / "Select time" / "Select date and time" |
| disabled, invalid, isClearable, autoFocus | boolean | false |
| size | `large \| default \| small` (same as Input) | default |
| formatDisplay | `(date: Date) => string` | dd/MM/yyyy, hh:mm a, or both |
| weekStartsOn | 0-6 | 0 (Sunday) |
| popoverClassName | string (on the popover content, e.g. `tw-z-[1100]`) | — |
| className, id, aria-label, data-cy | on the wrapper / trigger | — |

`DatePickerPanel`: `type`, `value`, `onChange(date)`, `onCancel?`, `minDate`, `maxDate`, `weekStartsOn`, `today?`, `className`. `onChange` fires on every pick for `date` / `time`, and once on Apply for `date-time`.

## Behaviour

- `date` closes after a pick. `time` stays open (three picks). `date-time` closes on Apply and on Cancel; picks are a draft until Apply, which is disabled until a day or time is picked.
- A day pick keeps the clock time of the current value (12:00 AM when none). `date-time` and `time` clamp the result to `minDate` / `maxDate` as instants; `date` does not.
- Time list: 12h -> 24h is `(hour % 12) + (PM ? 12 : 0)`. With no value, the first pick starts from 12:00 AM today. An off-grid minute that the value already has is added to the minute list. The selected option is centred in its column on mount.
- Six-week grid: first cell = the week-start day on or before the 1st; 42 days built with `new Date(y, m, 1 - lead + i)` (DST safe).
- Disabled days use `aria-disabled`, not `disabled`, so arrow keys can still land on them.

## Keyboard

- Trigger: Enter / Space opens. Focus lands on the selected day (or the hour list for `time`). Escape closes and returns focus to the trigger.
- Calendar (roving tab stop): arrows move a day, Home / End the week edge, PageUp / PageDown a month (day clamped). Enter / Space pick. Moving across a month edge changes the shown month.
- Time list: Tab reaches Hour, Minute, Period. Up / Down / Home / End move within a column, Enter / Space pick.

## Popover and focus traps

The popover content takes `popoverClassName` (the Popover default is `tw-z-50`; drawers sit at z-index 1000-1002, so pass `tw-z-[1100]`). `onFocusOutside` is prevented so a focus trap around the caller cannot close it. Pointer presses outside and Escape still close it. Tab past the last control does not close it.

## Token Mapping

| Element | Class |
|---|---|
| panel | `tw-bg-background-surface-layer-01 tw-border tw-border-border-weak tw-rounded-lg tw-shadow-elevation-400` |
| footer | `tw-border-0 tw-border-t tw-border-border-weak`, Cancel `outline` + Apply `primary`, both `size="medium"` |
| title | `tw-font-title-default tw-text-text-default` |
| weekday | `tw-font-body-small tw-text-text-placeholder` |
| cell | 28px, `tw-rounded-default`, hover `tw-bg-interactive-hover`, pressed `tw-bg-interactive-selected` |
| cell selected | `tw-bg-background-accent-weak tw-border-border-accent-strong tw-text-text-accent` |
| cell today / outside | `tw-text-text-accent` + medium / `tw-text-text-placeholder` |
| cell focus | `focus-visible:tw-ring-2 tw-ring-interactive-focus-outline` |
| scroll columns | scrollbar hidden (still scrolls) |
| trigger | `inputVariants({ size })` |

## Not covered

- Time options are not disabled by `minDate` / `maxDate` (the result is clamped instead).
- Prev / next month buttons are not disabled at the bounds.
- Month and weekday names are English only.

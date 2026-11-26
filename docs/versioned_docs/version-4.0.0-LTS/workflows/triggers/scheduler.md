---
id: scheduler
title: Trigger Using Scheduler
---

<PlanBadge type="team" />

A schedule runs a workflow automatically at set times, without a request from an application or an external system. Typical uses are a daily report, an hourly sync between two datasources or a weekly cleanup job.

Each schedule defines when the workflow runs, which version and environment it runs in, and which input values it uses. A workflow can have several schedules, for example one per environment.

## Step 1: Open the Schedules Panel

1. Open the workflow and click **Schedules** in the left sidebar.
2. Click **New schedule**.

## Step 2: Name the Schedule and Choose What It Runs

- **Schedule name**: A name that describes the schedule, such as `Daily sales report`. It must be unique within the workflow and up to 100 characters long.
- **Environment**: The environment the scheduled runs use.
- **Version**: The version of the workflow to run. Only versions available in the selected environment are listed.

A schedule always runs the version selected here. After a newer version is released, edit the schedule and select the new version to run it.

## Step 3: Set the Input Values

If the selected version declares workflow inputs, they're listed under **Input overrides**. Scheduled runs have no request body, so these are the values the workflow receives.

- Inputs that aren't selected use their default value.
- To use a different value, select the input and enter the value.

Inside the workflow, each value is available as `startTrigger.params.<name>`. A required input with no default value must be set here, or the scheduled runs fail.

## Step 4: Set the Timing

Select a **Schedule type** and a **Timezone**. The schedule follows the selected timezone, so a schedule set to run at 9:00 AM runs at 9:00 AM in that timezone.

### Interval

**Interval** covers regular schedules. Select how often the workflow runs in **Run every**, then when it runs within that period:

| Run every | Then Select |
| --------- | ----------- |
| **Minute** | Nothing else. The workflow runs every minute. |
| **Hour** | How many minutes into the hour, in 5-minute steps. |
| **Day** | The hour of the day. |
| **Week** | The day of the week and the hour. |
| **Month** | The day of the month and the hour. |

<img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/workflows/triggers/scheduler/schedule-interval.png" alt="New schedule set to run every day at 9:00 AM" />

### Cron

**Cron** covers timings that an interval can't express, such as weekdays only or several times a day. Enter a standard cron expression across five fields: **Minute**, **Hours**, **Day of the month**, **Month** and **Day of the week**. A `*` in a field means every value.

| Minute | Hours | Day of the month | Month | Day of the week | Runs |
| ------ | ----- | ---------------- | ----- | --------------- | ---- |
| `15` | `*` | `*` | `*` | `*` | At 15 minutes past every hour |
| `0` | `9` | `*` | `*` | `1-5` | At 9:00 AM, Monday to Friday |
| `30` | `18` | `1` | `*` | `*` | At 6:30 PM on the 1st of every month |

<img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/workflows/triggers/scheduler/schedule-cron.png" alt="New schedule with a cron expression for 9:00 AM, Monday to Friday" />

Below the fields, a summary such as **Set to run at 15 minutes into every hour** describes the timing in words. Check it before saving.

## Step 5: Save and Enable the Schedule

1. Click **Create schedule**. The schedule appears in the list, turned off.
2. Turn on the schedule's toggle in the list. The workflow starts running at the next scheduled time.

<img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/workflows/triggers/scheduler/schedule-list.png" alt="Schedules panel with an enabled schedule" />

New schedules are disabled so that they can be reviewed before they start running.

If a scheduled run is still in progress when the next one is due, the next run is skipped, so runs of the same schedule never overlap.

## Manage Schedules

The **Schedules** panel lists each schedule with its timing, version and environment. When the panel opens, the list is filtered to the current environment and version. Use the environment and version filters, or search by name, to find other schedules.

- **Enable or disable**: Turn the schedule's toggle on or off. A disabled schedule keeps its settings.
- **Edit**: Click the schedule, change its fields and click **Save**.
- **Delete**: Click the schedule, then click the delete icon. The schedule is deleted immediately, without a confirmation step.

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)

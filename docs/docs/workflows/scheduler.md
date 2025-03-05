---
id: workflow-scheduler
title: Scheduler
---

You can automate workflow execution by adding scheduled triggers that run at regular intervals. Use **Interval mode** to set the frequency with predefined options or **Cron mode** for more granular control with cron syntax. Additionally, you can specify a timezone to ensure the schedule aligns with local time. 

#### Creating a Webhook Trigger
- Click on the **Triggers** option in the left panel to open the Triggers tab.

  <div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/workflows/triggers/triggerbutton.png" alt="Schedules" />
  </div>

- Click on the **Schedules** option.

  <div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/workflows/scheduler/schedule.png" alt="Schedules" />
  </div>

- Click on the `+ New schedule` button to create new schedules. After clicking the button, A pop-up window will appear, offering two schedule creation modes. They are as follow:

## Interval Mode

Interval mode is ideal for simple schedules that do not require complex timing. You can specify intervals in minutes, hours, days, weeks, or months. For instance:

- **Timezone:** Ensures that the schedule aligns with the specified local time.
- **Minute:** Run tasks at intervals specified by the user, such as every 10 minutes.
- **Hour:** Schedule tasks at specific hours provided by the user.
- **Day:** Trigger tasks daily at a fixed time specified by the user.
- **Week:** Run tasks weekly on a specific day and time provided by the user.
- **Month:** Execute tasks monthly on specific date and time provided by the user.

<div style={{textAlign: 'center', paddingBottom: '15px'}}>
    <img className="screenshot-full" src="/img/workflows/scheduler/interval-mode.png" alt="Scheduler - Interval Mode" />
</div>

## Cron Mode

Cron mode offers precise control over scheduling using cron syntax, making it suitable for tasks that need to run at very specific times. For example:

- **`15 3 * * *`** runs a task daily at 3:15 AM.
- **`0 9 * * 1`** triggers tasks every Monday at 9 AM.
- **`0 0 1 * *`** schedules tasks on the first day of every month at midnight.
- **`*/30 * * * *`** executes every 30 minutes.

<div style={{textAlign: 'center', paddingBottom: '15px'}}>
    <img className="screenshot-full" src="/img/workflows/scheduler/cron-job-v2.png" alt="Scheduler - Cron Mode" />
</div>
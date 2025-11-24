---
id: scheduler
title: Trigger Using Scheduler
---

<br/>

You can automate workflow execution by adding scheduled triggers that run at regular intervals. Use **Interval mode** to set the frequency with predefined options or **Cron mode** for more granular control with cron syntax. Additionally, you can specify a timezone to ensure the schedule aligns with local time. 

## Types of Schedule

### Interval Mode

Interval mode is ideal for simple schedules. For example, you can trigger tasks every 10 minutes, run hourly updates, or initiate weekly routines. Just specify the interval in minutes, hours, days, weeks, or months to suit your needs.
    <img className="screenshot-full img-m" src="/img/workflows/triggers/scheduler/interval-mode.png" alt="Scheduler - Interval Mode" />

### Cron Mode

Cron mode offers precise scheduling using cron syntax. It’s perfect for tasks like running workflows daily at 3:15 AM, triggering actions every 15th of the month, or scheduling processes for weekdays only. With cron expressions like 0 9 * * 1 (every Monday at 9 AM), you can fine-tune your triggers with ease.
    <img className="screenshot-full img-m" src="/img/workflows/triggers/scheduler/cron-job.png" alt="Scheduler - Cron Mode" />

## Running Workflow at Schedule Time

### On Regular Intervals

1. Create and configure a workflow. Refer to the [Workflow Overview](/docs/workflows/overview) guide to create a new workflow.
2. Navigate to the Triggers section on the left panel. Click on **Schedules**. And then click on **+ New schedule**. Select **Interval** as the Label. <br/>
    <img style={{ marginTop: '15px' }} className="screenshot-full img-m" src="/img/workflows/triggers/scheduler/new-schedule.png" alt="Scheduler - Interval Mode" />
3. Fill the required fields.
    - **Timezone**: Select the local timezone on which you want to trigger the workflow.
    - **Run every**: Select the interval when you want to run the workflow.
    - **Environment**: Select the environement on which you want to run the workflow. 
    <img style={{ marginTop: '15px' }} className="screenshot-full img-m" src="/img/workflows/triggers/scheduler/set-interval.png" alt="Scheduler - Interval Mode" />
4. Click on **+ Create schedule** to create and save the schedule. By default the schedule is inactive, toggle the switch to activate the schedule. <br/>
    <img style={{ marginTop: '15px' }} className="screenshot-full img-s" src="/img/workflows/triggers/scheduler/enable.png" alt="Scheduler - Interval Mode" />

### On Cron Schedule

You can use Cron Syntax to configure a schedule. ToolJet offers an graphical user interface to configure corn schedule.

1. Create and configure a workflow. Refer to the [Workflow Overview](/docs/workflows/overview) guide to create a new workflow.
2. Navigate to the Triggers section on the left panel. Click on **Schedules**. And then click on **+ New schedule**. Select **Cron** as the Label. <br/>
    <img style={{ marginTop: '15px' }} className="screenshot-full img-m" src="/img/workflows/triggers/scheduler/cron-new-schedule.png" alt="Scheduler - Interval Mode" />
3. Fill the required fields.
    - **Timezone**: Select the local timezone on which you want to trigger the workflow.
    - Schedule when you want to trigger the workflow.
    - **Environment**: Select the environement on which you want to run the workflow. 
    <img style={{marginTop:'15px'}} className="screenshot-full img-m" src="/img/workflows/trigger-schedule/cron-schedule.png" alt="Navigate to Workflow Section" /> <br/>
    In the above image the workflow is schduled to trigger at the 15th minute of every hour, you can check that below the environment field as well. You can refer to **[this](https://crontab.guru/)** website to generate a cron schedule.
4. Click on **+ Create schedule** to create and save the schedule. By default the schedule is inactive, toggle the switch to activate the schedule. <br/>
    <img style={{ marginTop: '15px' }} className="screenshot-full img-s" src="/img/workflows/triggers/scheduler/enable.png" alt="Scheduler - Interval Mode" />
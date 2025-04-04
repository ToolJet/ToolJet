---
id: trigger-workflow-using-scheduler
title: Trigger Workflows Using Scheduler
---

ToolJet allows workflows to be triggered automatically at regular intervals or at specific scheduled times. Users can also specify the timezone to ensure that schedules align with local time.

## Running Workflow at Schedule Intervals

1. Create a workflow. Refer to the [Workflow Overview](/docs/workflows/overview) guide to create a new workflow.

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/workflows/trigger-schedule/create-workflow.png" alt="Create a Workflow" /> 

2. Navigate to the Triggers section on the left panel.

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/workflows/trigger-schedule/left-panel.png" alt="Trigger Panel on the Left" />

3. Click on **Schedules**. And then click on **+ New schedule**.

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/workflows/trigger-schedule/new-schedule.png" alt="Adding a new schedule" />

4. Select **Interval** as the Label.

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/workflows/trigger-schedule/interval.png" alt="Navigate to Workflow Section" />

5. Fill the required fields.
    - **Timezone**: Select the local timezone on which you want to trigger the workflow.
    - **Run every**: Select the interval when you want to run the workflow.
    - **Environment**: Select the environement on which you want to run the workflow. 

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/workflows/trigger-schedule/set-interval.png" alt="Navigate to Workflow Section" />

6. Click on **+ Create schedule** to create and save the schedule.

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/workflows/trigger-schedule/create-schedule.png" alt="Navigate to Workflow Section" />

7. By default the schedule is inactive, toggle the switch to activate the schedule.

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/workflows/trigger-schedule/activate-schedule.png" alt="Navigate to Workflow Section" />


## Running Workflow on a Cron Schedule

You can use Cron Syntax to configure a schedule. ToolJet offers an graphical user interface to configure corn schedule.

1. Create a workflow. You can refer to the [Workflow Overview](/docs/workflows/overview) guide to create the workflow.

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/workflows/trigger-schedule/create-workflow.png" alt="Create a Workflow" /> 

2. Navigate to the Triggers section on the left panel.

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/workflows/trigger-schedule/left-panel.png" alt="Trigger Panel on the Left" />

3. Click on **Schedules**. And then click on **+ New schedule**.

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/workflows/trigger-schedule/new-schedule.png" alt="Adding a new schedule" />

4. Select **Cron** as the Label.

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/workflows/trigger-schedule/cron.png" alt="Navigate to Workflow Section" />

5. Fill the required fields.
    - **Timezone**: Select the local timezone on which you want to trigger the workflow.
    - Schedule when you want to trigger the workflow.
    - **Environment**: Select the environement on which you want to run the workflow. 

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/workflows/trigger-schedule/cron-schedule.png" alt="Navigate to Workflow Section" />

In the above image the workflow is schduled to trigger at the 15th minute of every hour, you can check that below the environment field as well. You can refer to **[this](https://crontab.guru/)** website to generate a cron schedule.

6. Click on **+ Create schedule** to create and save the schedule.

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/workflows/trigger-schedule/saved-cron-schedule.png" alt="Navigate to Workflow Section" />

7. By default the schedule is inactive, toggle the switch to activate the schedule.

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/workflows/trigger-schedule/activate-cron-schedule.png" alt="Navigate to Workflow Section" />

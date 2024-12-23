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

1. Create a workflow. You can refer to the [Workflow Overview](/docs/workflows/overview) guide to create the workflow.
2. Navigate to the Triggers section on the left panel.
3. Click on **Schedules**. By default, the schedule trigger is disabled. Toggle the switch to enable the schedule trigger. 
4. Select **Cron** as the Label.
5. Select your local timezone.
6. Select the time you want to run workflow on.
7. Select the Environment.
8. Click on **Save**


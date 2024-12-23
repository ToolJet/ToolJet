---
id: trigger-workflow-using-scheduler
title: Trigger Workflows Using Scheduler
---

ToolJet allows workflows to be triggered automatically at regular intervals or at specific scheduled times. Users can also specify the timezone to ensure that schedules align with local time.

## Running Workflow at Schedule Intervals

1. Create a workflow. Refer to the [Workflow Overview](/docs/workflows/overview) guide to create a new workflow.

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/workflows/trigger-schedule/create-workflow.png" alt="Navigate to Workflow Section" />

2. Navigate to the Triggers section on the left panel.

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/workflows/trigger-schedule/left-panel.png" alt="Navigate to Workflow Section" />

3. Click on **Schedules**. And then click on **+ New schedule**.

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/workflows/trigger-schedule/new-schedule.png" alt="Navigate to Workflow Section" />

4. Select **Interval** as the Label.

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/workflows/trigger-schedule/interval.png" alt="Navigate to Workflow Section" />

5. Select your local timezone.

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/workflows/trigger-schedule/timezone.png" alt="Navigate to Workflow Section" />

6. Select the interval you want to run workflow on.

<img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/workflows/trigger-schedule/set-interval.png" alt="Navigate to Workflow Section" />

7. Select the Environment.
8. Click on **Save**

## Running Workflow on a Cron Schedule

1. Create a workflow. You can refer to the [Workflow Overview](/docs/workflows/overview) guide to create the workflow.
2. Navigate to the Triggers section on the left panel.
3. Click on **Schedules**. By default, the schedule trigger is disabled. Toggle the switch to enable the schedule trigger. 
4. Select **Cron** as the Label.
5. Select your local timezone.
6. Select the time you want to run workflow on.
7. Select the Environment.
8. Click on **Save**


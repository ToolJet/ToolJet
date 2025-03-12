import { Injectable, OnModuleInit, OnApplicationShutdown } from '@nestjs/common';
import { NativeConnection, Worker } from '@temporalio/worker';
import { Connection, Client, ScheduleOptions, ScheduleOverlapPolicy } from '@temporalio/client';
import * as moment from 'moment';
import { CreateWorkflowExecutionDto } from '@dto/create-workflow-execution.dto';
import { WorkflowSchedule } from '@entities/workflow_schedule.entity';
import { isValidCron } from 'cron-validator';

@Injectable()
export class TemporalService implements OnModuleInit, OnApplicationShutdown {
  client: Client;
  temporalConnection: Connection = undefined;
  workerNativeConnection: NativeConnection = undefined;
  worker: Worker = undefined;

  async onModuleInit() {
    this.#connectToTemporal();
  }

  async onApplicationShutdown() {
    await this.#closeConnection();
    await this.#closeWokerNativeConnection();
  }

  async isTemporalConnected(): Promise<boolean> {
    try {
      await this.temporalConnection.healthService.check({});
      return true;
    } catch (exception) {
      return false;
    }
  }

  async runWorker() {
    try {
      console.log(`\x1b[1;33m[INFO] Starting worker connection to Temporal\x1b[0m`);
      this.workerNativeConnection = await NativeConnection.connect({
        address: process.env.TEMPORAL_SERVER_ADDRESS,
      });
      this.worker = await Worker.create({
        connection: this.workerNativeConnection,
        namespace: process.env?.TOOLJET_WORKFLOWS_TEMPORAL_NAMESPACE ?? 'default',
        taskQueue: process.env?.TEMPORAL_TASK_QUEUE_NAME_FOR_WORKFLOWS,
        workflowsPath: require.resolve('../temporal/workflows'),
        activities: require('../temporal/activities'),
      });

      console.log(`\x1b[1;33m[INFO] Worker connection to Temporal established.\x1b[0m`);
      await this.worker.run();
    } catch (error) {
      console.log(`\x1b[1;31m[ERROR] Temporal server could not be reached, exiting.\x1b[0m Reason: ${error.message}`);
      process.exit(1);
    }
  }

  async createScheduleInTemporal(
    workflowScheduleId: string,
    settings: any,
    schedule: WorkflowSchedule,
    environmentId,
    timezone,
    userId,
    paused = true
  ) {
    const workflowExecution = new CreateWorkflowExecutionDto();
    workflowExecution.executeUsing = 'version';
    workflowExecution.appVersionId = schedule.workflowId;
    workflowExecution.environmentId = environmentId;

    workflowExecution.params = {};
    workflowExecution.userId = userId;
    workflowExecution.app = schedule.workflow.appId;

    const interval: string =
      schedule.type === 'cron'
        ? `${settings.minute} ${settings.hours} ${settings.dayOfMonth} ${settings.month} ${settings.dayOfWeek}`
        : this.#convertWorkflowScheduleSettingsToCronString(settings);

    if (isValidCron(interval, { seconds: false }) == false) {
      throw Error('Invalid interval configuration ' + interval);
    }

    const scheduleOptions: ScheduleOptions = {
      scheduleId: workflowScheduleId,
      action: {
        taskQueue: process.env?.TEMPORAL_TASK_QUEUE_NAME_FOR_WORKFLOWS ?? 'tooljet-workflows',
        type: 'startWorkflow',
        workflowType: 'execute',
        workflowId: `schedule-${workflowScheduleId}`,
        args: [JSON.parse(JSON.stringify(workflowExecution))],
        retry: {
          maximumAttempts: 1,
        },
      },
      spec: {
        cronExpressions: [interval],
        timezone,
      },
      policies: {
        overlap: ScheduleOverlapPolicy.SKIP,
      },
      state: {
        paused,
      },
    };

    await this.client.schedule.create(scheduleOptions);
  }

  async setScheduleState(scheduleId: string, paused: boolean) {
    const handle = await this.client.schedule.getHandle(scheduleId);

    if (paused) await handle.pause('Paused from ToolJet');
    else await handle.unpause('Unpaused from ToolJet');
  }

  async removeSchedule(scheduleId: string) {
    const handle = await this.client.schedule.getHandle(scheduleId);

    await handle.delete();
  }

  async updateSchedule(updatedSchedule: WorkflowSchedule, settings: any, timezone, existingSchedule, userId) {
    const handle = this.client.schedule.getHandle(updatedSchedule.id);

    await handle.delete();

    try {
      await this.createScheduleInTemporal(
        updatedSchedule.id,
        updatedSchedule.details,
        updatedSchedule,
        updatedSchedule.environmentId,
        timezone,
        userId,
        !existingSchedule.active
      );
    } catch (error) {
      console.log({ error });
      await this.createScheduleInTemporal(
        existingSchedule.id,
        existingSchedule.details,
        existingSchedule,
        existingSchedule.environmentId,
        existingSchedule.timezone,
        userId,
        !existingSchedule.active
      );

      throw error;
    }
  }

  #convertWorkflowScheduleSettingsToCronString(settings: any): string {
    switch (settings.frequency) {
      case 'minute': {
        return '* * * * *';
      }

      case 'hour': {
        const { minutes } = settings;
        return `${minutes} * * * *`;
      }

      case 'day': {
        const { hour } = settings;
        const hourOfTheDay = this.#convertToHourOffset(hour);
        return `0 ${hourOfTheDay} * * *`;
      }

      case 'week': {
        const { day, hour } = settings;

        const dayOfTheWeek = moment().day(day).day();
        const hourOfTheDay = this.#convertToHourOffset(hour);

        return `0 ${hourOfTheDay} * * ${dayOfTheWeek}`;
      }

      case 'month': {
        const { date: dayOfMonth, hour } = settings;

        const hourOfTheDay = this.#convertToHourOffset(hour);

        return `0 ${hourOfTheDay} ${dayOfMonth} * *`;
      }
    }
  }

  #convertToHourOffset(timeString) {
    const time = moment(timeString, 'h:mm A');
    return time.hours() + time.minutes() / 60;
  }

  #connectToTemporal() {
    if (!process.env.WORKER) {
      if (process.env.ENABLE_WORKFLOW_SCHEDULING === 'true') {
        console.log(`\x1b[1;33m[INFO] Connecting to Temporal server\x1b[0m`);
        Connection.connect({
          address: process.env.TEMPORAL_SERVER_ADDRESS,
        })
          .then((connection) => {
            this.temporalConnection = connection;
            this.client = new Client({
              connection,
              namespace: process.env?.TOOLJET_WORKFLOWS_TEMPORAL_NAMESPACE ?? 'default',
            });
            console.log(`\x1b[1;32m[INFO] Connected to Temporal server\x1b[0m`);
          })
          .catch((reason) => {
            console.log(
              `\x1b[1;33m [WARNING] Temporal server could not be reached, workflow schedules cannot be created, deleted or updated.\x1b[0m Reason: ${reason.message}`
            );
          });
      } else {
        console.log(
          `\x1b[1;33m[INFO] Not connecting to temporal as ENABLE_WORKFLOW_SCHEDULING is not set to 'true'. \x1b[0m`
        );
      }
    }
  }

  async #closeConnection() {
    if (this.temporalConnection) {
      console.log(`\x1b[1;33m[INFO] Closing Temporal connection\x1b[0m`);
      this.temporalConnection
        .close()
        .then(() => {
          console.log(`\x1b[1;32m[INFO] Temporal connection closed\x1b[0m`);
        })
        .catch(() => {
          console.log(`\x1b[1;31m[ERROR] Could not close Temporal connection\x1b[0m`);
        });
    }
  }

  async #closeWokerNativeConnection() {
    if (process.env.WORKER) {
      console.log(`\x1b[1;33m[INFO] Closing worker connection to Temporal\x1b[0m`);
      try {
        await this.workerNativeConnection.close();
        console.log(`\x1b[1;32m[INFO] Worker connection to temporal closed\x1b[0m`);
      } catch (error) {
        console.log(
          `\x1b[1;31m[ERROR] Worker connection to temporal failed to close. Reason: ${error.message} \x1b[0m`
        );
      }
    }
  }

  shutDownWorker() {
    this.worker.shutdown();
  }
}

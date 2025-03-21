// import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
// import { EventEmitter2 } from '@nestjs/event-emitter';
// import { DataSource, EntityManager } from 'typeorm';
// import { App } from 'src/entities/app.entity';
// import { AppEnvironment } from 'src/entities/app_environments.entity';
// import { AppVersion } from 'src/entities/app_version.entity';
// import { v4 as uuidv4 } from 'uuid';
// import { WorkflowExecutionsService } from '@services/workflow_executions.service';

// @Injectable()
// export class WorkflowWebhooksService {
//   constructor(
//     private readonly manager: EntityManager,
//     private eventEmitter: EventEmitter2,
//     private workflowExecutionsService: WorkflowExecutionsService,
//     private readonly _dataSource: DataSource
//   ) {}

//   async triggerWorkflow(workflowApps, workflowParams, environment, response) {
//     // When workflow version is introduced - Query needs to be tweaked
//     const appVersion = await this.manager
//       .createQueryBuilder(AppVersion, 'av')
//       .select(['av.definition'])
//       .innerJoinAndSelect(App, 'a', 'av.appId = a.id')
//       .where('av.appId = :id', { id: workflowApps.appId })
//       .getOne();

//     const app = await this.manager
//       .createQueryBuilder(App, 'app')
//       .where('app.id = :id', { id: workflowApps.appId })
//       .getOne();
//     const enabled = app.isMaintenanceOn;

//     if (!enabled) throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);

//     // Type validation for input values passed.
//     const inputValidators = appVersion?.definition?.webhookParams ?? [];
//     if (inputValidators.length) {
//       const inputParamsSet = new Set();
//       Object.entries(workflowParams).forEach(([key, _value]) => {
//         inputParamsSet.add(key);
//       });

//       inputValidators.forEach((validator: { key: string; dataType: string }) => {
//         if (!inputParamsSet.has(validator.key)) throw new BadRequestException(`Params - ${validator.key} is missing`);
//       });
//     }

//     const sanitisedWorkflowParams = {};
//     inputValidators.length &&
//       Object.entries(workflowParams).forEach(([key, value]) => {
//         const condition = inputValidators.find((input) => input.key == key);
//         if (condition) {
//           const isValidType = this.isValidateInputTypes(value, condition.dataType);
//           if (!isValidType) throw new BadRequestException(`${key} has incorrect datatype`);
//           if (isValidType) sanitisedWorkflowParams[key] = value;
//         }
//       });

//     const environmentDetails = await this.manager
//       .createQueryBuilder(App, 'apps')
//       .leftJoinAndSelect(AppEnvironment, 'ae', 'ae.organizationId = apps.organizationId')
//       .where('apps.id = :id and ae.name = :envName', { id: workflowApps.appId, envName: environment })
//       .select(['apps.id', 'ae.id'])
//       .execute();

//     if (!environmentDetails.length) throw new HttpException('Invalid environment', 404);
//     const webhookEnvironmentId = environmentDetails[0]?.ae_id ?? '';

//     const workflowExecution = await this.workflowExecutionsService.create(workflowApps);
//     const result = await this.workflowExecutionsService.execute(
//       workflowExecution,
//       sanitisedWorkflowParams,
//       webhookEnvironmentId,
//       response
//     );
//     return result;
//   }

//   async updateWorkflow(workflowId, workflowValuesToUpdate) {
//     if (Object.keys(workflowValuesToUpdate).length === 0) throw new BadRequestException('Values to update is empty');
//     if (!workflowId) throw new BadRequestException('Invalid workflowId');
//     const { isEnable } = workflowValuesToUpdate;
//     const workflowApps = await this._dataSource
//       .getRepository(App)
//       .createQueryBuilder('apps')
//       .where('apps.id = :id', { id: workflowId })
//       .getOne();

//     if (!workflowApps) throw new NotFoundException("Workflow doesn't exist");

//     return this._dataSource
//       .createQueryBuilder()
//       .update(App)
//       .set({
//         workflowEnabled: isEnable === 'endPointTrigger',
//         ...(!workflowApps?.workflowApiToken && { workflowApiToken: uuidv4() }),
//       })
//       .where('id = :id', { id: workflowId })
//       .execute();
//   }

//   private isValidateInputTypes(value, type) {
//     switch (type) {
//       case 'string':
//         return typeof value == 'string';
//       case 'number':
//         return typeof value == 'number';
//       case 'array':
//         return Array.isArray(value);
//       case 'object':
//         return typeof value == 'object';
//       case 'boolean':
//         return typeof value == 'boolean';
//       case 'null':
//         return value == null;
//       default:
//         return false;
//     }
//   }
// }

import { CreateWorkflowExecutionDto } from '@dto/create-workflow-execution.dto';
import { Body, Controller, ForbiddenException, Get, Param, Post, UseGuards } from '@nestjs/common';
import { WorkflowExecutionsService } from '@services/workflow_executions.service';
import { App } from 'src/entities/app.entity';
import { WorkflowExecution } from 'src/entities/workflow_execution.entity';
import { decamelizeKeys } from 'humps';
import { User } from 'src/decorators/user.decorator';
import { JwtAuthGuard } from 'src/modules/auth/jwt-auth.guard';
import { AppsAbilityFactory } from 'src/modules/casl/abilities/apps-ability.factory';
import { InjectRepository } from '@nestjs/typeorm';
import { AppVersion } from 'src/entities/app_version.entity';
import { Repository } from 'typeorm';

@Controller('workflow_executions')
export class WorkflowExecutionsController {
  constructor(
    private workflowExecutionsService: WorkflowExecutionsService,
    private appsAbilityFactory: AppsAbilityFactory
  ) {}

  @InjectRepository(AppVersion)
  private appVersionsRepository: Repository<AppVersion>;

  @InjectRepository(App)
  private appsRepository: Repository<App>;

  @InjectRepository(WorkflowExecution)
  private workflowExecutionRepository: Repository<WorkflowExecution>;

  // @UseGuards(JwtAuthGuard)
  // !Removing auth guard for allowing workflow executions to be triggered for public apps
  @Post()
  async create(@User() user, @Body() createWorkflowExecutionDto: CreateWorkflowExecutionDto) {
    const appVersion =
      createWorkflowExecutionDto.executeUsing === 'version'
        ? await this.appVersionsRepository.findOne(createWorkflowExecutionDto.appVersionId, { relations: ['app'] })
        : undefined;
    const app = appVersion ? appVersion.app : await this.appsRepository.findOne(createWorkflowExecutionDto.appId);

    let ability = null;

    if (user) {
      if (createWorkflowExecutionDto.executeUsing !== 'app') {
        ability = await this.appsAbilityFactory.appsActions(user, app.id);
        if (!ability.can('viewApp', app)) {
          throw new ForbiddenException(
            JSON.stringify({
              organizationId: app.organizationId,
            })
          );
        }
      } else {
        ability = await this.appsAbilityFactory.appsActions(user, createWorkflowExecutionDto.app);
      }
    }

    const workflowExecution = await this.workflowExecutionsService.create(createWorkflowExecutionDto);
    const result = await this.workflowExecutionsService.execute(workflowExecution, createWorkflowExecutionDto.params);
    return { workflowExecution, result };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/status')
  async status(@Param('id') id: any, @User() user) {
    const workflowExecution = await this.workflowExecutionRepository.findOne(id, { relations: ['appVersion'] });
    const app = await this.appsRepository.findOne(workflowExecution.appVersion.appId);

    const ability = await this.appsAbilityFactory.appsActions(user, app.id);
    if (!ability.can('viewApp', app)) {
      throw new ForbiddenException(
        JSON.stringify({
          organizationId: app.organizationId,
        })
      );
    }

    return decamelizeKeys(await this.workflowExecutionsService.getStatus(id));
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async show(@Param('id') id: any, @User() user) {
    const workflowExecution = await this.workflowExecutionRepository.findOne(id, { relations: ['appVersion'] });
    const app = await this.appsRepository.findOne(workflowExecution.appVersion.appId);

    const ability = await this.appsAbilityFactory.appsActions(user, app.id);
    if (!ability.can('editApp', app)) {
      throw new ForbiddenException(
        JSON.stringify({
          organizationId: app.organizationId,
        })
      );
    }

    return await this.workflowExecutionsService.getWorkflowExecution(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('all/:appVersionId')
  async index(@Param('appVersionId') appVersionId: any, @User() user) {
    const appVersion = await this.appVersionsRepository.findOne(appVersionId, { relations: ['app'] });
    const app = appVersion.app;

    const ability = await this.appsAbilityFactory.appsActions(user, app.id);
    if (!ability.can('viewApp', app)) {
      throw new ForbiddenException(
        JSON.stringify({
          organizationId: app.organizationId,
        })
      );
    }
    return await this.workflowExecutionsService.listWorkflowExecutions(appVersionId);
  }
}

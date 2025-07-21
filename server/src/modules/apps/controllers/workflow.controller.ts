import { App as AppEntity } from '@entities/app.entity';
import { MODULES } from '@modules/app/constants/modules';
import { InitModule } from '@modules/app/decorators/init-module';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { Controller, UseGuards, Get } from '@nestjs/common';
import { decamelizeKeys } from 'humps';
import { FeatureAbilityGuard } from '../ability/guard';
import { ValidAppGuard } from '../guards/valid-app.guard';
import { AppDecorator as App } from '@modules/app/decorators/app.decorator';
import { WorkflowService } from '../services/workflow.service';
import { IWorkflowController } from '../interfaces/IControllerWorkflow';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from '../constants';

@InitModule(MODULES.APP)
@Controller('apps')
export class WorkflowController implements IWorkflowController {
  constructor(protected readonly workflowService: WorkflowService) {}

  @InitFeature(FEATURE_KEY.GET)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Get(':id/workflows')
  async fetchWorkflows(@App() app: AppEntity) {
    const result = await this.workflowService.getWorkflows(app.organizationId);

    return decamelizeKeys({ workflows: result });
  }
}

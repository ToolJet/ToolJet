import { Controller, Post, UseGuards, Body } from '@nestjs/common';
import { User } from '@modules/app/decorators/user.decorator';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { WorkflowCountGuard } from '@modules/licensing/guards/workflowcount.guard';
import { AppCreateDto } from '@modules/apps/dto';
import { IWorkflowsController } from '@modules/workflows/interfaces/IWorkflowsController';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from '@modules/workflows/constants';

@InitModule(MODULES.WORKFLOWS)
@Controller('workflows')
export class WorkflowsController implements IWorkflowsController {
  @InitFeature(FEATURE_KEY.CREATE_WORKFLOW)
  @UseGuards(JwtAuthGuard, WorkflowCountGuard)
  @Post()
  async create(@User() user, @Body() appCreateDto: AppCreateDto): Promise<any> {
    throw new Error('Method not implemented.');
  }
}

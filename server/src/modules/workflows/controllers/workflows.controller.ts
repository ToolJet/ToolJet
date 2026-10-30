import { Controller, Post, Get, Param, ParseUUIDPipe, UseGuards, Body, NotImplementedException } from '@nestjs/common';
import { User } from '@modules/app/decorators/user.decorator';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { WorkflowCountGuard } from '@modules/licensing/guards/workflowcount.guard';
import { AppCreateDto } from '@modules/apps/dto';
import { IWorkflowsController } from '@modules/workflows/interfaces/IWorkflowsController';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from '@modules/workflows/constants';
import { WorkflowConsumersResponseDto } from '@modules/workflows/dto/workflow-consumers-response.dto';

@InitModule(MODULES.WORKFLOWS)
@Controller('workflows')
export class WorkflowsController implements IWorkflowsController {
  @InitFeature(FEATURE_KEY.CREATE_WORKFLOW)
  @UseGuards(JwtAuthGuard, WorkflowCountGuard)
  @Post()
  async create(@User() user, @Body() appCreateDto: AppCreateDto): Promise<any> {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.LIST_WORKFLOW_CONSUMERS)
  @UseGuards(JwtAuthGuard)
  @Get(':id/consumers')
  async consumers(@User() user, @Param('id', ParseUUIDPipe) id: string): Promise<WorkflowConsumersResponseDto> {
    throw new NotImplementedException();
  }
}

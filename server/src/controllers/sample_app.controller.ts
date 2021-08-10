import { Controller, Post, Request, Param, UseGuards } from '@nestjs/common';
import { SampleAppCreationService } from '@services/sample_app_creation.service';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';

@Controller('sample')
export class SampleAppController {
  constructor(private sampleAppCreationService: SampleAppCreationService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async deploy(@Request() req, @Param() _params) {
    const { identifier } = req.body;
    const newApp = await this.sampleAppCreationService.perform(
      req.user,
      identifier,
    );

    return newApp;
  }
}

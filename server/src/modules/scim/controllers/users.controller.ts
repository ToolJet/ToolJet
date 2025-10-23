import { MODULES } from '@modules/app/constants/modules';
import { InitModule } from '@modules/app/decorators/init-module';
import { Controller, UseGuards } from '@nestjs/common';
import { FeatureAbilityGuard } from '../ability/guard';
import { AppGitPullDto, AppGitPushDto, AppImportRequestDto } from '../dto';
import { ScimService } from '../service';
import SCIMMY from 'scimmy';

@Controller('scim/v2')
@InitModule(MODULES.SCIM)
@UseGuards(FeatureAbilityGuard)
export class UsersController {
  constructor(private readonly scimService: ScimService) {}

  @Get('Users')
  async getUsers(@Req() req: Request, @Res() res: Response) {
    try {
      const result = await new SCIMMY.Resources.User().read(req);
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  @Get('Users/:id')
  async getUser(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    try {
      const result = await new SCIMMY.Resources.User().read(req);
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  @Post('Users')
  async createUser(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    try {
      const result = await new SCIMMY.Resources.User().write(req);
      return res.status(HttpStatus.CREATED).json(result);
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  @Put('Users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const result = await new SCIMMY.Resources.User().write(req);
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  @Patch('Users/:id')
  async patchUser(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const result = await new SCIMMY.Resources.User().patch(req);
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  @Delete('Users/:id')
  async deleteUser(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    try {
      await new SCIMMY.Resources.User().dispose(req);
      return res.status(HttpStatus.NO_CONTENT).send();
    } catch (error) {
      return this.handleError(res, error);
    }
  }

}

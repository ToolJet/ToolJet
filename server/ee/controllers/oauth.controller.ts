import { Controller, Post, Request } from '@nestjs/common';
import { OauthService } from '../services/oauth/oauth.service'

@Controller('oauth')
export class OauthController {

  constructor(
    private oauthService: OauthService
  ) { }

  @Post('sign-in')
  async create(@Request() req) {
    const result = await this.oauthService.signIn(req.body.token);
    return result;
  }
}


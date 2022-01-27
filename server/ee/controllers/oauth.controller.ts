import { Body, Controller, Post, Request } from '@nestjs/common';
import { OauthService } from '../services/oauth/oauth.service';

@Controller('oauth')
export class OauthController {
  constructor(private oauthService: OauthService) {}

  @Post('sign-in')
  async create(@Request() req, @Body() body) {
    const result = await this.oauthService.signIn(body);
    return result;
  }
}

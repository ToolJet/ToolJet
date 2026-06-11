import { Injectable, NotImplementedException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { User } from '@entities/user.entity';
import { Response } from 'express';
import { IWebsiteAuthService } from '../interfaces/IService';
import { SSOType } from '@entities/sso_config.entity';
import { CreateAiUserDto } from '../dto';

@Injectable()
export class WebsiteAuthService implements IWebsiteAuthService {
  async handleOnboarding(
    userParams: CreateAiUserDto,
    existingUser?: User,
    response?: Response,
    ssoType?: SSOType.GOOGLE | SSOType.GIT,
    manager?: EntityManager
  ) {
    throw new NotImplementedException('Method not implemented');
  }

  setSessionAICookies(response: Response, keyValues: Record<string, any>) {
    return { message: 'AI Cookies set successfully' };
  }

  clearSessionAICookies(response: Response, cookies: Record<string, any>) {
    return { message: 'AI Cookies cleared successfully' };
  }
}

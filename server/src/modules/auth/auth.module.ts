import { Module } from '@nestjs/common';
import { AuthService } from '../../services/auth.service';
import { UsersModule } from '../users/users.module';
import { OauthController } from '@ee/controllers/oauth.controller';
import { SessionService } from '@services/session.service';

@Module({
  imports: [UsersModule],
  providers: [AuthService],
  controllers: [OauthController],
  exports: [AuthService, SessionService],
})
export class AuthModule {}

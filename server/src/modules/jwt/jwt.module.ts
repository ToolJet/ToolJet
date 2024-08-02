import { Global, Module } from '@nestjs/common';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtService } from '@services/jwt.service';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot(),
    NestJwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        return {
          secret: config.get<string>('SECRET_KEY_BASE'),
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [JwtStrategy, JwtAuthGuard, JwtService],
  exports: [JwtAuthGuard, JwtService],
})
export class JwtModule {}

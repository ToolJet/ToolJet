import { Module } from '@nestjs/common';
import { AuthService } from '../../services/auth.service';
import { JwtStrategy } from './jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { UsersService } from '../../services/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    TypeOrmModule.forFeature([User]),
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '6000s' },
    }),
  ],
  providers: [AuthService, JwtStrategy, UsersService],
  exports: [AuthService],
})
export class AuthModule {}
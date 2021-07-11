import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../entities/user.entity';
const bcrypt = require('bcrypt');

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) { }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);

    if(!user) return null;

    const isVerified = await bcrypt.compare(password, user.password);

    return isVerified ? user : null;
  }

  async login(params: any) {
    const user = await this.validateUser(params.email, params.password);

    if (user) {
      const payload = { username: user.id, sub: user.email };

      return {
        auth_token: this.jwtService.sign(payload),
      };
    } else {
      throw new UnauthorizedException('Invalid credentials');
    }
  }
}

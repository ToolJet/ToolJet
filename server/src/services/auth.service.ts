import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { OrganizationsService } from './organizations.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../entities/user.entity';
import { OrganizationUsersService } from './organization_users.service';
const bcrypt = require('bcrypt');

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private organizationsService: OrganizationsService,
    private organizationUsersService: OrganizationUsersService
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

  async signup(params: any) {
    // Check if the installation allows user signups
    if(process.env.DISABLE_SIGNUPS === 'true') {
      return {}
    }
    
    const { email } = params;
    const organization = await this.organizationsService.create('Untitled organization');
    const user = await this.usersService.create({ email }, organization);
    const organizationUser = await this.organizationUsersService.create(user, organization, 'admin');

    return user;
    
  }
}

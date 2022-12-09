import { Injectable, CanActivate } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class FirstUserSignupDisableGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>
  ) {}

  async canActivate(): Promise<any> {
    return (await this.usersRepository.count()) !== 0;
  }
}

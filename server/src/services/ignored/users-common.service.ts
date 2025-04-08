import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UserCommonService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  @OnEvent('user.update')
  async handleUserUpdate(event: { userId: string; details: Partial<User> }) {
    const { userId, details } = event;
    return await this.userRepository.update(userId, details);
  }
}

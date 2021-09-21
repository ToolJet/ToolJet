import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment } from '../entities/comment.entity';
import { UsersService } from 'src/services/users.service';
import { BadRequestException } from '@nestjs/common';
import { User } from '../entities/user.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private usersService: UsersService,
  ) {}

  async create(user: User): Promise<Comment> {
    return new Comment();
  }
}

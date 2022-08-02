import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentUsersController } from '@controllers/comment_users.controller';
import { CommentUsersService } from '@services/comment_users.service';
import { CaslModule } from '../casl/casl.module';
import { CommentUsers } from 'src/entities/comment_user.entity';
import { User } from 'src/entities/user.entity';
import { AppVersion } from 'src/entities/app_version.entity';

@Module({
  controllers: [CommentUsersController],
  imports: [TypeOrmModule.forFeature([CommentUsers, User, AppVersion]), CaslModule],
  providers: [CommentUsersService],
})
export class CommentUsersModule {}

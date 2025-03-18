import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentController } from '@controllers/comment.controller';
import { CommentService } from '@services/comment.service';
import { CommentRepository } from '../../repositories/comment.repository';
import { CaslModule } from '../casl/casl.module';
import { User } from 'src/entities/user.entity';
import { Organization } from 'src/entities/organization.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { CommentUsers } from 'src/entities/comment_user.entity';
import { Comment } from 'src/entities/comment.entity';
import { EmailModule } from '@modules/email/module';

@Module({
  controllers: [CommentController],
  imports: [TypeOrmModule.forFeature([CommentUsers, AppVersion, User, Organization, Comment]), CaslModule, EmailModule],
  providers: [CommentService, CommentRepository],
})
export class CommentModule {}

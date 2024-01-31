import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentController } from '@controllers/comment.controller';
import { CommentService } from '@services/comment.service';
import { CommentRepository } from '../../repositories/comment.repository';
import { CaslModule } from '../casl/casl.module';
import { EmailService } from '@services/email.service';
import { User } from 'src/entities/user.entity';
import { Organization } from 'src/entities/organization.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { CommentUsers } from 'src/entities/comment_user.entity';
import { InstanceSettingsModule } from '../instance_settings/instance_settings.module';

@Module({
  controllers: [CommentController],
  imports: [
    TypeOrmModule.forFeature([CommentRepository, CommentUsers, AppVersion, User, Organization]),
    CaslModule,
    InstanceSettingsModule,
  ],
  providers: [CommentService, EmailService],
})
export class CommentModule {}

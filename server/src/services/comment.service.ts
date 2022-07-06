import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Comment } from '../entities/comment.entity';
import { CommentRepository } from '../repositories/comment.repository';
import { CreateCommentDto, UpdateCommentDto } from '../dto/comment.dto';
import { groupBy, head } from 'lodash';
import { EmailService } from './email.service';
import { Repository } from 'typeorm';
import { App } from 'src/entities/app.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { User } from 'src/entities/user.entity';
import { CommentUsers } from 'src/entities/comment_user.entity';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(CommentRepository)
    private commentRepository: CommentRepository,
    @InjectRepository(App)
    private appsRepository: Repository<App>,
    @InjectRepository(AppVersion)
    private appVersionsRepository: Repository<AppVersion>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(CommentUsers)
    private commentUsersRepository: Repository<CommentUsers>,
    private emailService: EmailService
  ) {}

  public async createComment(
    createCommentDto: CreateCommentDto,
    userId: string,
    organizationId: string
  ): Promise<Comment> {
    try {
      const comment = await this.commentRepository.createComment(createCommentDto, userId, organizationId);
      const user = await this.usersRepository.findOne({ where: { id: userId } });
      const appVersion = await this.appVersionsRepository.findOne({ where: { id: createCommentDto.appVersionsId } });
      const app = await this.appsRepository.findOne({ where: { id: appVersion.appId } });
      const appLink = `${process.env.TOOLJET_HOST}/apps/${app.id}`;
      const commentLink = `${appLink}?threadId=${comment.threadId}&commentId=${comment.id}`;

      for (const userId of createCommentDto.mentionedUsers) {
        const mentionedUser = await this.usersRepository.findOne({ where: { id: userId }, relations: ['avatar'] });
        if (!mentionedUser) return null; // todo: invite user
        void this.emailService.sendCommentMentionEmail(
          mentionedUser.email,
          user.firstName,
          app.name,
          appLink,
          commentLink,
          comment.createdAt.toUTCString(),
          comment.comment,
          mentionedUser.avatar?.data.toString('base64')
        );
        void this.commentUsersRepository.save(
          this.commentUsersRepository.create({ commentId: comment.id, userId: mentionedUser.id })
        );
      }
      return comment;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  public async getComments(threadId: string, appVersionsId: string): Promise<Comment[]> {
    return await this.commentRepository.find({
      where: {
        threadId,
        appVersionsId,
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  public async getOrganizationComments(organizationId: string, appVersionsId: string): Promise<Comment[]> {
    return await this.commentRepository.find({
      where: {
        organizationId,
        appVersionsId,
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  public async getNotifications(
    appId: string,
    userId: string,
    isResolved = false,
    appVersionsId: string
  ): Promise<Comment[]> {
    const comments = await this.commentRepository.find({
      where: {
        thread: { appId, isResolved },
        appVersionsId,
      },
      order: {
        createdAt: 'DESC',
      },
      relations: ['thread'],
    });

    const groupedComments = groupBy(comments, 'threadId');

    const _comments = [];

    Object.keys(groupedComments).map((k) => {
      _comments.push({ comment: head(groupedComments[k]), count: groupedComments[k].length });
    });

    return _comments;
  }

  public async getComment(commentId: string): Promise<Comment> {
    const foundComment = await this.commentRepository.findOne({ where: { id: commentId } });
    if (!foundComment) {
      throw new NotFoundException('Comment not found');
    }
    return foundComment;
  }

  public async editComment(commentId: string, updateCommentDto: UpdateCommentDto): Promise<Comment> {
    const editedComment = await this.commentRepository.findOne({ where: { id: commentId } });
    if (!editedComment) {
      throw new NotFoundException('Comment not found');
    }
    return this.commentRepository.editComment(updateCommentDto, editedComment);
  }

  public async deleteComment(commentId: string): Promise<void> {
    await this.commentRepository.delete(commentId);
  }
}

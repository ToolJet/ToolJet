import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment } from '../entities/comment.entity';
import { Repository } from 'typeorm';
import { AppVersion } from 'src/entities/app_version.entity';
import { User } from 'src/entities/user.entity';
import { CommentUsers } from 'src/entities/comment_user.entity';
import { UpdateCommentUserDto } from '@dto/comment-user.dto';

@Injectable()
export class CommentUsersService {
  constructor(
    @InjectRepository(AppVersion)
    private appVersionsRepository: Repository<AppVersion>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(CommentUsers)
    private commentUsersRepository: Repository<CommentUsers>
  ) {}

  private async getAppLinks(appVersionsId: string, comment: Comment) {
    const appVersion = await this.appVersionsRepository.findOne({ where: { id: appVersionsId }, relations: ['app'] });
    const appLink = `${process.env.TOOLJET_HOST}/apps/${appVersion.app.id}`;
    const commentLink = `${appLink}?threadId=${comment.threadId}&commentId=${comment.id}`;

    return [appLink, commentLink, appVersion.app.name];
  }

  public async findAll(userId: string, isRead = false) {
    const notifications = await this.commentUsersRepository.find({
      where: {
        userId,
        isRead,
      },
      order: {
        createdAt: 'DESC',
      },
      relations: ['comment'],
    });

    if (!notifications) {
      throw new NotFoundException('User notifications not found');
    }

    try {
      const _notifications = notifications.map(async (notification) => {
        const [, commentLink] = await this.getAppLinks(notification.comment.appVersionsId, notification.comment);
        const user = await this.usersRepository.findOne({
          where: { id: notification.comment.userId },
          relations: ['avatar'],
        });
        const creator = {
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar?.data.toString('base64'),
        };
        return {
          id: notification.id,
          creator,
          comment: notification.comment.comment,
          createdAt: notification.comment.createdAt,
          updatedAt: notification.comment.updatedAt,
          commentLink,
          isRead: notification.isRead,
        };
      });
      return Promise.all(_notifications);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  public async update(commentUserId: string, body: UpdateCommentUserDto) {
    const item = await this.commentUsersRepository.update(commentUserId, { isRead: body.isRead });
    return item;
  }

  public async updateAll(userId: string, body: UpdateCommentUserDto) {
    const { isRead } = body;
    const item = await this.commentUsersRepository.update({ userId }, { isRead });
    return item;
  }
}

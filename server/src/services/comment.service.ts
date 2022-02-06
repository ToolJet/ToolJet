import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Comment } from '../entities/comment.entity';
import { CommentRepository } from '../repositories/comment.repository';
import { CreateCommentDTO } from '../dto/create-comment.dto';
import { groupBy, head } from 'lodash';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(CommentRepository)
    private commentRepository: CommentRepository
  ) {}

  public async createComment(createCommentDto: CreateCommentDTO, id: string, organizationId: string): Promise<Comment> {
    return await this.commentRepository.createComment(createCommentDto, id, organizationId);
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

  public async getComment(commentId: number): Promise<Comment> {
    const foundComment = await this.commentRepository.findOne({ where: { id: commentId } });
    if (!foundComment) {
      throw new NotFoundException('Comment not found');
    }
    return foundComment;
  }

  public async editComment(commentId: number, createCommentDto: CreateCommentDTO): Promise<Comment> {
    const editedComment = await this.commentRepository.findOne({ where: { id: commentId } });
    if (!editedComment) {
      throw new NotFoundException('Comment not found');
    }
    return this.commentRepository.editComment(createCommentDto, editedComment);
  }

  public async deleteComment(commentId: number): Promise<void> {
    await this.commentRepository.delete(commentId);
  }
}

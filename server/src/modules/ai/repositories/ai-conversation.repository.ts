import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { AiConversation } from '@entities/ai_conversation.entity';
import { dbTransactionWrap } from '@helpers/database.helper';

@Injectable()
export class AiConversationRepository extends Repository<AiConversation> {
  constructor(private dataSource: DataSource) {
    super(AiConversation, dataSource.createEntityManager());
  }

  async findByAppAndUser(
    appId: string,
    userId: string,
    conversationType: 'generate' | 'learn'
  ): Promise<AiConversation> {
    // Order by lastOpenedAt first (nulls last), then fall back to createdAt
    return await this.createQueryBuilder('conversation')
      .where('conversation.appId = :appId', { appId })
      .andWhere('conversation.userId = :userId', { userId })
      .andWhere('conversation.conversationType = :conversationType', { conversationType })
      .orderBy('conversation.last_opened_at', 'DESC', 'NULLS LAST')
      .addOrderBy('conversation.created_at', 'DESC')
      .getOne();
  }

  async createNewConversation(
    userId: string,
    appId: string,
    conversationType: 'generate' | 'learn',
    manager?: EntityManager
  ): Promise<AiConversation> {
    return dbTransactionWrap((manager: EntityManager) => {
      const conversation = manager.create(AiConversation, {
        userId,
        appId,
        conversationType,
      });
      return manager.save(conversation);
    }, manager || this.manager);
  }

  async findAllByAppAndUser(
    appId: string,
    userId: string,
    conversationType: 'generate' | 'learn'
  ): Promise<AiConversation[]> {
    return await this.find({
      where: {
        appId,
        userId,
        conversationType,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findById(conversationId: string): Promise<AiConversation> {
    return await this.findOne({
      where: { id: conversationId },
    });
  }

  async createOne(conversation: Partial<AiConversation>, manager?: EntityManager): Promise<AiConversation> {
    return dbTransactionWrap((manager: EntityManager) => {
      return manager.save(manager.create(AiConversation, conversation));
    }, manager || this.manager);
  }

  async updateOne(id: string, updatableData: Partial<AiConversation>, manager?: EntityManager): Promise<void> {
    await dbTransactionWrap((manager: EntityManager) => {
      return manager.update(AiConversation, id, updatableData);
    }, manager || this.manager);
  }
}

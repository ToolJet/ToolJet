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
    return await this.findOne({
      where: {
        appId,
        userId,
        conversationType,
      },
      relations: ['aiConversationMessages'],
      order: {
        createdAt: 'DESC',
      },
    });
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

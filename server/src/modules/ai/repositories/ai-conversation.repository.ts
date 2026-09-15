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
    // First try to find the active conversation
    const activeConversation = await this.findOne({
      where: { appId, userId, conversationType, active: true },
    });
    if (activeConversation) return activeConversation;

    // Fallback: most recently created
    return await this.findOne({
      where: { appId, userId, conversationType },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * `defaults` carries the LLM selection the new chat is pinned to — the builder's workspace
   * default, or the source chat's selection on a handoff. Merged into the insert rather than
   * written afterwards so a chat is never briefly unpinned, which would let it resolve against
   * a default that moves out from under it.
   */
  async createNewConversation(
    userId: string,
    appId: string,
    conversationType: 'generate' | 'learn',
    defaults?: Partial<AiConversation>,
    manager?: EntityManager
  ): Promise<AiConversation> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      // Deactivate all existing conversations for this app/user/type
      await manager.update(AiConversation, { appId, userId, conversationType }, { active: false });

      const conversation = manager.create(AiConversation, {
        ...defaults,
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

  async setActive(
    conversationId: string,
    appId: string,
    userId: string,
    conversationType: 'generate' | 'learn'
  ): Promise<void> {
    await dbTransactionWrap(async (manager: EntityManager) => {
      // Deactivate all conversations of same app/user/type
      await manager.update(AiConversation, { appId, userId, conversationType }, { active: false });

      // Activate the target conversation
      await manager.update(AiConversation, conversationId, { active: true });
    }, this.manager);
  }
}

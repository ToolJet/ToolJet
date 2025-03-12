import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository, Not, IsNull } from 'typeorm';
import { AiConversationMessage } from '@entities/ai_conversation_message.entity';
import { dbTransactionWrap } from '@helpers/database.helper';

@Injectable()
export class AiConversationMessageRepository extends Repository<AiConversationMessage> {
  constructor(private dataSource: DataSource) {
    super(AiConversationMessage, dataSource.createEntityManager());
  }

  async findLatestByConversationId(conversationId: string): Promise<AiConversationMessage[]> {
    return await this.find({
      where: {
        aiConversationId: conversationId,
        isLatest: true,
      },
      order: {
        createdAt: 'ASC',
      },
      relations: ['aiResponseVote'],
    });
  }

  async findById(id: string): Promise<AiConversationMessage> {
    return await this.findOne({
      where: { id },
      relations: ['conversation', 'votes'],
    });
  }

  async findLatestUserMessage(): Promise<AiConversationMessage> {
    return await this.findOne({
      where: {
        messageType: 'user',
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async createOne(message: Partial<AiConversationMessage>, manager?: EntityManager): Promise<AiConversationMessage> {
    return dbTransactionWrap((manager: EntityManager) => {
      return manager.save(manager.create(AiConversationMessage, message));
    }, manager || this.manager);
  }

  async updateOne(id: string, updatableData: Partial<AiConversationMessage>, manager?: EntityManager): Promise<void> {
    await dbTransactionWrap((manager: EntityManager) => {
      return manager.update(AiConversationMessage, id, updatableData);
    }, manager || this.manager);
  }

  async findConversationMessages(conversationId: string, limit: number = 5): Promise<AiConversationMessage[]> {
    return await this.find({
      where: {
        aiConversationId: conversationId,
        content: Not(IsNull()),
      },
      order: {
        createdAt: 'DESC',
      },
      take: limit,
    });
  }

  async findMessageById(id: string): Promise<AiConversationMessage> {
    return await this.findOne({
      where: { id },
    });
  }
}

import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository, UpdateResult } from 'typeorm';
import { AiResponseVote } from '@entities/ai_response_vote.entity';
import { dbTransactionWrap } from '@helpers/database.helper';

@Injectable()
export class AiResponseVoteRepository extends Repository<AiResponseVote> {
  constructor(private dataSource: DataSource) {
    super(AiResponseVote, dataSource.createEntityManager());
  }

  async get(id: string): Promise<AiResponseVote> {
    return await this.findOne({
      where: { id },
      relations: ['message'],
    });
  }

  async findByMessageId(messageId: string): Promise<AiResponseVote> {
    return await this.findOne({
      where: {
        aiConversationMessageId: messageId,
      },
    });
  }

  async createOne(vote: Partial<AiResponseVote>, manager?: EntityManager): Promise<AiResponseVote> {
    return dbTransactionWrap((manager: EntityManager) => {
      return manager.save(manager.create(AiResponseVote, vote));
    }, manager || this.manager);
  }

  async updateOne(id: string, updatableData: Partial<AiResponseVote>, manager?: EntityManager): Promise<void> {
    await dbTransactionWrap((manager: EntityManager) => {
      return manager.update(AiResponseVote, id, updatableData);
    }, manager || this.manager);
  }

  async updateVote(id: string, data: Partial<AiResponseVote>, manager?: EntityManager): Promise<UpdateResult> {
    return dbTransactionWrap((manager: EntityManager) => {
      return manager.update(AiResponseVote, id, data);
    }, manager || this.manager);
  }
}

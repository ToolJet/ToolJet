import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { AppHistory } from '@entities/app_history.entity';

@Injectable()
export class AppHistoryRepository {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager
  ) {}

  private get repository(): Repository<AppHistory> {
    return this.entityManager.getRepository(AppHistory);
  }

  async findByAppVersionId(appVersionId: string): Promise<AppHistory[]> {
    throw new Error('Method not implemented.');
  }

  async create(historyData: Partial<AppHistory>): Promise<AppHistory> {
    throw new Error('Method not implemented.');
  }

  async findById(id: string): Promise<AppHistory> {
    throw new Error('Method not implemented.');
  }

  async update(id: string, updateData: Partial<AppHistory>): Promise<AppHistory> {
    throw new Error('Method not implemented.');
  }

  async delete(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async findWithPagination(
    appVersionId: string,
    page: number,
    limit: number,
    filters?: any
  ): Promise<{ entries: AppHistory[]; total: number }> {
    throw new Error('Method not implemented.');
  }
}
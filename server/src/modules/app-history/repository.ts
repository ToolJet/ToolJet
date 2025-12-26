import { Injectable } from '@nestjs/common';
import { EntityManager, QueryRunner } from 'typeorm';
import { AppHistory } from '@entities/app_history.entity';
import { RETENTION_BUFFER_LIMIT } from '@modules/app-history/constants';
import { dbTransactionWrap } from '@helpers/database.helper';

@Injectable()
export class AppHistoryRepository {
  async getMaxSequenceNumber(appVersionId: string): Promise<number> {
    return await dbTransactionWrap(async (manager) => {
      const result = await manager
        .createQueryBuilder(AppHistory, 'history')
        .select('MAX(history.sequenceNumber)', 'max')
        .where('history.appVersionId = :appVersionId', { appVersionId })
        .getRawOne();

      return result?.max ? parseInt(result.max, 10) : 0;
    });
  }

  async createHistoryEntryWithLock(
    queryRunner: QueryRunner,
    data: {
      appVersionId: string;
      userId: string;
      historyType: 'snapshot' | 'delta';
      actionType: string;
      operationScope?: Record<string, any>;
      description: string;
      changePayload: any;
      parentId?: string;
      isAiGenerated?: boolean;
    }
  ): Promise<AppHistory> {
    // Lock all existing rows for this appVersionId and get the max sequence
    // We select the actual rows with lock, then compute max from them
    const existingEntries = await queryRunner.manager
      .createQueryBuilder(AppHistory, 'history')
      .select('history.sequenceNumber')
      .where('history.appVersionId = :appVersionId', { appVersionId: data.appVersionId })
      .setLock('pessimistic_write')
      .orderBy('history.sequenceNumber', 'DESC')
      .limit(1)
      .getOne();

    const nextSequence =
      (existingEntries?.sequenceNumber ? parseInt(existingEntries.sequenceNumber.toString(), 10) : 0) + 1;

    // Create history entry
    const historyEntry = queryRunner.manager.create(AppHistory, {
      ...data,
      sequenceNumber: nextSequence,
    });

    return queryRunner.manager.save(AppHistory, historyEntry);
  }

  async getHistoryForHistoryId(historyId: string): Promise<AppHistory | null> {
    return await dbTransactionWrap(async (manager) => {
      return await manager
        .createQueryBuilder(AppHistory, 'history')
        .leftJoinAndSelect('history.user', 'user')
        .where('history.id = :historyId', { historyId })
        .orderBy('history.sequenceNumber', 'DESC')
        .getOne();
    });
  }

  async getHistoryForVersion(
    appVersionId: string,
    page: number = 0,
    limit: number = 20,
    filters?: {
      userId?: string;
      actionType?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<[AppHistory[], number]> {
    return await dbTransactionWrap(async (manager) => {
      const query = manager
        .createQueryBuilder(AppHistory, 'history')
        .leftJoinAndSelect('history.user', 'user')
        .where('history.appVersionId = :appVersionId', { appVersionId })
        .orderBy('history.sequenceNumber', 'DESC');

      if (filters?.userId) {
        query.andWhere('history.userId = :userId', { userId: filters.userId });
      }

      if (filters?.actionType) {
        query.andWhere('history.actionType = :actionType', { actionType: filters.actionType });
      }

      if (filters?.startDate) {
        query.andWhere('history.createdAt >= :startDate', { startDate: filters.startDate });
      }

      if (filters?.endDate) {
        query.andWhere('history.createdAt <= :endDate', { endDate: filters.endDate });
      }

      query.skip(page * limit).take(limit);

      return query.getManyAndCount();
    });
  }

  async getNearestSnapshot(
    appVersionId: string,
    targetSequence: number,
    existingManager?: EntityManager
  ): Promise<AppHistory | null> {
    const executeQuery = async (manager: EntityManager) => {
      const results = await manager.query(
        `SELECT * FROM app_history
         WHERE app_version_id = $1
           AND history_type = 'snapshot'
           AND sequence_number <= $2
         ORDER BY sequence_number DESC
         LIMIT 1`,
        [appVersionId, targetSequence]
      );
      if (results.length === 0) return null;
      // Map snake_case columns to camelCase properties
      const row = results[0];
      return {
        id: row.id,
        appVersionId: row.app_version_id,
        userId: row.user_id,
        sequenceNumber: row.sequence_number,
        parentId: row.parent_id,
        historyType: row.history_type,
        actionType: row.action_type,
        operationScope: row.operation_scope,
        description: row.description,
        changePayload: row.change_payload,
        isAiGenerated: row.is_ai_generated,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      } as AppHistory;
    };

    if (existingManager) {
      return executeQuery(existingManager);
    }
    return dbTransactionWrap(executeQuery);
  }

  async getDeltasInRange(
    appVersionId: string,
    startSequence: number,
    endSequence: number,
    existingManager?: EntityManager
  ): Promise<AppHistory[]> {
    const executeQuery = async (manager: EntityManager) => {
      const results = await manager.query(
        `SELECT * FROM app_history
         WHERE app_version_id = $1
           AND history_type = 'delta'
           AND sequence_number > $2
           AND sequence_number <= $3
         ORDER BY sequence_number ASC`,
        [appVersionId, startSequence, endSequence]
      );
      // Map snake_case columns to camelCase properties
      return results.map((row: any) => ({
        id: row.id,
        appVersionId: row.app_version_id,
        userId: row.user_id,
        sequenceNumber: row.sequence_number,
        parentId: row.parent_id,
        historyType: row.history_type,
        actionType: row.action_type,
        operationScope: row.operation_scope,
        description: row.description,
        changePayload: row.change_payload,
        isAiGenerated: row.is_ai_generated,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })) as AppHistory[];
    };

    if (existingManager) {
      return executeQuery(existingManager);
    }
    return dbTransactionWrap(executeQuery);
  }

  async pruneOldHistoryEntries(appVersionId: string): Promise<void> {
    return await dbTransactionWrap(async (manager) => {
      // Get the count of entries
      const count = await manager
        .createQueryBuilder(AppHistory, 'history')
        .where('history.appVersionId = :appVersionId', { appVersionId })
        .getCount();

      // When we exceed the retention limit, delete complete snapshot groups
      // RETENTION_BUFFER_LIMIT = 110 (11 complete groups of 10)
      if (count > RETENTION_BUFFER_LIMIT) {
        // Find the second snapshot to ensure we keep at least one complete snapshot group
        // Snapshots occur at sequences 1, 11, 21, 31, etc. (every 10th entry starting from 1)
        const secondSnapshot = await manager
          .createQueryBuilder(AppHistory, 'history')
          .where('history.appVersionId = :appVersionId', { appVersionId })
          .andWhere('history.historyType = :historyType', { historyType: 'snapshot' })
          .orderBy('history.sequenceNumber', 'ASC')
          .offset(1) // Skip the first snapshot, get the second one
          .limit(1)
          .getOne();

        if (secondSnapshot) {
          // Delete all entries before the second snapshot
          // This ensures we always maintain complete snapshot groups
          const cutoffSequence = secondSnapshot.sequenceNumber;

          // First, update parent_id references to null for any entries that reference entries to be deleted
          await manager
            .createQueryBuilder()
            .update(AppHistory)
            .set({ parentId: null })
            .where('appVersionId = :appVersionId', { appVersionId })
            .andWhere(
              'parentId IN (SELECT id FROM app_history WHERE app_version_id = :appVersionId AND sequence_number < :cutoffSequence)',
              { appVersionId, cutoffSequence }
            )
            .execute();

          // Then delete entries older than the cutoff (complete first snapshot group)
          await manager
            .createQueryBuilder()
            .delete()
            .from(AppHistory)
            .where('appVersionId = :appVersionId', { appVersionId })
            .andWhere('sequenceNumber < :cutoffSequence', { cutoffSequence })
            .execute();
        }
      }
    });
  }

  async getHistoryBySequence(appVersionId: string, sequenceNumber: number): Promise<AppHistory | null> {
    return await dbTransactionWrap(async (manager) => {
      return await manager.findOne(AppHistory, {
        where: {
          appVersionId,
          sequenceNumber,
        },
        relations: ['user'],
      });
    });
  }

  async getLatestSnapshot(appVersionId: string): Promise<AppHistory | null> {
    return await dbTransactionWrap(async (manager) => {
      const snapshots = await manager.find(AppHistory, {
        where: {
          appVersionId,
          historyType: 'snapshot' as any,
        },
        order: { sequenceNumber: 'DESC' },
        take: 1,
      });

      return snapshots.length > 0 ? snapshots[0] : null;
    });
  }

  async count(options: any): Promise<number> {
    return await dbTransactionWrap(async (manager) => {
      return await manager.count(AppHistory, options);
    });
  }

  async findOne(options: any): Promise<AppHistory | null> {
    return await dbTransactionWrap(async (manager) => {
      return await manager.findOne(AppHistory, options);
    });
  }

  async save(entity: AppHistory): Promise<AppHistory> {
    return await dbTransactionWrap(async (manager) => {
      return await manager.save(AppHistory, entity);
    });
  }

  async getVersionAndAppIdForHistory(
    historyId: string
  ): Promise<{ appVersionId: string | null; appId: string | null }> {
    return await dbTransactionWrap(async (manager) => {
      const history = await manager.findOne(AppHistory, {
        where: { id: historyId },
        relations: ['appVersion'],
      });

      if (!history) {
        return { appVersionId: null, appId: null };
      }

      return {
        appVersionId: history.appVersionId,
        appId: history.appVersion?.appId || null,
      };
    });
  }
}

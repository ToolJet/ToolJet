import { UserMfa } from '@entities/user_mfa.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';

@Injectable()
export class UserMfaRepository extends Repository<UserMfa> {
  constructor(private readonly dataSource: DataSource) {
    super(UserMfa, dataSource.createEntityManager());
  }

  findByIdentifier(identifier: string, manager: EntityManager) {
    return manager.findOne(UserMfa, { where: { identifier } });
  }

  saveRecord(record: UserMfa, manager: EntityManager) {
    return manager.save(UserMfa, record);
  }

  deleteByIdentifier(identifier: string, manager: EntityManager) {
    return manager.delete(UserMfa, { identifier });
  }
}

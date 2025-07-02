import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository, UpdateResult } from 'typeorm';
import { dbTransactionWrap } from '@helpers/database.helper';
import { Artifact } from '@entities/artifact.entity';

@Injectable()
export class ArtifactRepository extends Repository<Artifact> {
  constructor(private dataSource: DataSource) {
    super(Artifact, dataSource.createEntityManager());
  }
}

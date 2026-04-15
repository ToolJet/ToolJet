import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Artifact } from '@entities/artifact.entity';

@Injectable()
export class ArtifactRepository extends Repository<Artifact> {
  constructor(private dataSource: DataSource) {
    super(Artifact, dataSource.createEntityManager());
  }
}

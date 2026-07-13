import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { GITConnectionType, OrganizationGitSync } from '@entities/organization_git_sync.entity';
import { OrganizationGitSsh } from '@entities/gitsync_entities/organization_git_ssh.entity';
import { OrganizationGitHttps } from '@entities/gitsync_entities/organization_git_https.entity';
import { OrganizationGitLab } from '@entities/gitsync_entities/organization_gitlab.entity';
import { OrganizationGitCreateDto } from '@dto/organization_git.dto';
import { getProviderDescriptor } from './provider-descriptors';

// CRUD on organization_git_sync and the three per-provider sibling tables.
// Pure DB access — no encryption, no git network calls, no env-registry reads.
@Injectable()
export class GitSyncConfigsRepository extends Repository<OrganizationGitSync> {
  constructor(private readonly dataSource: DataSource) {
    super(OrganizationGitSync, dataSource.createEntityManager());
  }

  private getRepo<T>(target: { new (): T }, manager?: EntityManager): Repository<T> {
    return manager ? manager.getRepository(target) : this.dataSource.getRepository(target);
  }

  // ─── Reads ─────────────────────────────────────────────────────────────

  findOrgGitByOrganizationId(organizationId: string, manager?: EntityManager): Promise<OrganizationGitSync | null> {
    return this.getRepo(OrganizationGitSync, manager).findOne({
      where: { organizationId },
      relations: ['gitSsh', 'gitHttps', 'gitLab'],
    });
  }

  findOrgGitById(
    organizationGitId: string,
    organizationId: string,
    manager?: EntityManager
  ): Promise<OrganizationGitSync | null> {
    return this.getRepo(OrganizationGitSync, manager).findOne({
      where: { id: organizationGitId, organizationId },
    });
  }

  // ─── Writes (parent) ───────────────────────────────────────────────────

  createOrganizationGit(
    dto: OrganizationGitCreateDto,
    manager?: EntityManager
  ): Promise<OrganizationGitSync> {
    const repo = this.getRepo(OrganizationGitSync, manager);
    const entity = repo.create({
      organizationId: dto.organizationId,
    });
    return repo.save(entity);
  }

  // Updates a writable subset of OrganizationGitSync columns. Caller is responsible
  // for any cross-field validation (e.g. requiring autoCommit before isBranchingEnabled=true).
  async updateOrgGitConfig(
    organizationId: string,
    organizationGitId: string,
    updateData: Partial<Pick<OrganizationGitSync, 'autoCommit' | 'isBranchingEnabled' | 'schemaVersion' | 'useEnvConfig'>>,
    manager?: EntityManager
  ): Promise<void> {
    if (Object.keys(updateData).length === 0) return;
    await this.getRepo(OrganizationGitSync, manager).update({ organizationId, id: organizationGitId }, updateData);
  }

  // Resets autoCommit so a downstream delete doesn't leave the parent in an
  // "auto-commit on with no provider" state. Same call used after delete by the legacy code.
  updateAutoCommit(
    organizationId: string,
    organizationGitId: string,
    autoCommit: boolean,
    manager?: EntityManager
  ): Promise<any> {
    return this.getRepo(OrganizationGitSync, manager).update(
      { organizationId, id: organizationGitId },
      { autoCommit }
    );
  }

  // ─── Writes (per-provider) ─────────────────────────────────────────────

  async updateProviderEnabled(
    organizationGitId: string,
    gitType: GITConnectionType,
    isEnabled: boolean,
    manager?: EntityManager
  ): Promise<void> {
    const target = this.providerEntity(gitType);
    if (!target) return;
    await this.getRepo(target, manager).update({ configId: organizationGitId } as any, { isEnabled });
  }

  // Throws via findOneOrFail so the controller can surface a clean 404 if the sub-row
  // is gone. CASCADE on config_id removes any DSV/branch tracking tied to this provider.
  async deleteProviderConfig(
    organizationGitId: string,
    gitType: GITConnectionType,
    manager?: EntityManager
  ): Promise<void> {
    const target = this.providerEntity(gitType);
    if (!target) return;
    const repo = this.getRepo(target, manager);
    await repo.findOneOrFail({ where: { configId: organizationGitId } as any });
    await repo.delete({ configId: organizationGitId } as any);
  }

  private providerEntity(
    gitType: GITConnectionType
  ): { new (): OrganizationGitSsh | OrganizationGitHttps | OrganizationGitLab } | null {
    // Data-driven via the shared descriptor registry — adding a provider needs no edit here.
    return getProviderDescriptor(gitType)?.entity ?? null;
  }
}

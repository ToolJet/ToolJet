import { AppGitSync } from '@entities/app_git_sync.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';

@Injectable()
export class AppGitRepository extends Repository<AppGitSync> {
  constructor(private dataSource: DataSource) {
    super(AppGitSync, dataSource.createEntityManager());
  }

  async findAppGitById(appGitId: string): Promise<AppGitSync> {
    return this.findOne({
      where: { id: appGitId },
      relations: ['orgGit'],
    });
  }
  async findAppGitByAppId(appId: string): Promise<AppGitSync> {
    return this.findOne({
      where: { appId: appId },
      relations: ['orgGit'],
    });
  }

  // Branch-copy apps (platform git sync) don't have their own app_git_sync.
  // Caller used to do appId lookup + co_relation_id fallback as two queries —
  // collapse into one IN() and prefer the direct appId match in code.
  // organizationId, if provided, restricts the fallback row (co_relation_id match)
  // to the same org — prevents cross-org leaks when co_relation_id is shared via git.
  async findAppGitByAppOrCoRelationId(
    appId: string,
    coRelationId?: string,
    organizationId?: string
  ): Promise<AppGitSync | null> {
    const ids = coRelationId && coRelationId !== appId ? [appId, coRelationId] : [appId];
    const matches = await this.find({ where: { appId: In(ids) }, relations: ['orgGit'] });
    if (matches.length === 0) return null;

    const direct = matches.find((m) => m.appId === appId);
    if (direct) return direct;

    const fallback = matches[0];
    if (organizationId && fallback?.orgGit?.organizationId !== organizationId) return null;
    return fallback;
  }

  async findAppGitByAppIdSSH(appId: string): Promise<AppGitSync> {
    return this.findOne({
      where: { appId: appId },
      relations: ['orgGit', 'orgGit.gitSsh'],
    });
  }
  async findAppGitByIdSSH(appGitId: string): Promise<AppGitSync> {
    return this.findOne({
      where: { id: appGitId },
      relations: ['orgGit', 'orgGit.gitSsh'],
    });
  }

  async findAppGitByAppIdHTTPS(appId: string): Promise<AppGitSync> {
    return this.findOne({
      where: { appId: appId },
      relations: ['orgGit', 'orgGit.gitHttps'],
    });
  }
  async findAppGitByIdHTTPS(appGitId: string): Promise<AppGitSync> {
    return this.findOne({
      where: { id: appGitId },
      relations: ['orgGit', 'orgGit.gitHttps'],
    });
  }

  async findAppGitByIdGitLab(appGitId: string): Promise<AppGitSync> {
    return this.findOne({
      where: { id: appGitId },
      relations: ['orgGit', 'orgGit.gitLab'],
    });
  }
  async findAppGitByAppIdGitLab(appId: string): Promise<AppGitSync> {
    return this.findOne({
      where: { appId: appId },
      relations: ['orgGit', 'orgGit.gitLab'],
    });
  }
}

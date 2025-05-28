import { AppGitSync } from '@entities/app_git_sync.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

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

import { Injectable } from '@nestjs/common';

@Injectable()
export class PlatformGitPullService {
  async pullApps(..._args: any[]): Promise<{
    imported: number;
    skipped: number;
    stale: number;
    outdated: number;
    errors: number;
    firstErrorMessage: string | null;
    deletedCoRelationIds: string[];
  }> {
    return {
      imported: 0,
      skipped: 0,
      stale: 0,
      outdated: 0,
      errors: 0,
      firstErrorMessage: null,
      deletedCoRelationIds: [],
    };
  }

  async pullModules(..._args: any[]): Promise<{
    imported: number;
    skipped: number;
    stale: number;
    outdated: number;
    errors: number;
    firstErrorMessage: string | null;
    deletedCoRelationIds: string[];
  }> {
    return {
      imported: 0,
      skipped: 0,
      stale: 0,
      outdated: 0,
      errors: 0,
      firstErrorMessage: null,
      deletedCoRelationIds: [],
    };
  }

  async pullWorkflows(..._args: any[]): Promise<{
    imported: number;
    skipped: number;
    stale: number;
    outdated: number;
    errors: number;
    firstErrorMessage: string | null;
    deletedCoRelationIds: string[];
  }> {
    return {
      imported: 0,
      skipped: 0,
      stale: 0,
      outdated: 0,
      errors: 0,
      firstErrorMessage: null,
      deletedCoRelationIds: [],
    };
  }

  async pullDataSources(..._args: any[]): Promise<void> {
    return;
  }

  async hydrateStubApp(..._args: any[]): Promise<any> {
    return null;
  }

  async runPinnedToWorkspacePull<T>(_organizationId: string, _branchId: string, fn: () => Promise<T>): Promise<T> {
    return fn();
  }

  async pullDraftIfBehindWorkspacePull(..._args: any[]): Promise<null> {
    return null;
  }
}

import { AppVersion, AppVersionStatus, AppVersionType } from '@entities/app_version.entity';
import { FindOneOptions } from 'typeorm';

// The one draft on the default branch (the continuity draft kept after a publish). Its name is a
// generated id, so URLs address it with DRAFT_SENTINEL instead.
export async function findDefaultBranchDraft(
  versionRepository: { findOne(options: FindOneOptions<AppVersion>): Promise<AppVersion | null> },
  appId: string,
  defaultBranchId: string | undefined
): Promise<AppVersion | null> {
  if (!defaultBranchId) return null;
  return versionRepository.findOne({
    where: {
      appId,
      branchId: defaultBranchId,
      status: AppVersionStatus.DRAFT,
      versionType: AppVersionType.VERSION,
      isStub: false,
    },
    relations: ['branch'],
    order: { createdAt: 'DESC' },
  });
}

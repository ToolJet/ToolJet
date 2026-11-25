/** @group platform */
import { MODULE_INFO } from 'src/modules/app/constants/module-info';
import { MODULES } from 'src/modules/app/constants/modules';
import { FEATURE_KEY } from 'src/modules/app-git/constants';
import { FeatureConfig } from 'src/modules/app/types';

// Git writes must still run the role check on a public app, not be skipped because it is public.
describe('AppGit public-app write protection', () => {
  const gitWriteFeatures: ReadonlyArray<[label: string, feature: FEATURE_KEY]> = [
    ['push (GIT_SYNC_APP)', FEATURE_KEY.GIT_SYNC_APP],
    ['pull into app (GIT_UPDATE_APP)', FEATURE_KEY.GIT_UPDATE_APP],
    ['rename (GIT_APP_VERSION_RENAME)', FEATURE_KEY.GIT_APP_VERSION_RENAME],
  ];

  it.each(gitWriteFeatures)('does not skip the role check on a public app for %s', (_label, feature) => {
    const config: FeatureConfig | undefined = MODULE_INFO?.[MODULES.APP_GIT]?.[feature];

    expect(config).toBeDefined();
    // The flag the guard reads at ability.guard.ts to decide NOT to skip the check on a public app.
    expect(config?.shouldNotSkipPublicApp).toBe(true);
  });
});

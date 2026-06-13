import * as cePosthog from '@/modules/common/helpers/posthog';
import * as cloudPosthog from '@ee/modules/common/helpers/posthog';

// Only cloud has its own posthog implementation; CE and self-hosted EE share
// the CE one (this mirrors the old helperModules map exactly). The ternary
// folds at build time via DefinePlugin.
const posthogHelper = process.env.TOOLJET_EDITION === 'cloud' ? cloudPosthog : cePosthog;

export default posthogHelper;

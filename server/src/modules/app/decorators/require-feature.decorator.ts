import { LICENSE_FEATURE_ID_KEY } from '../constants';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { SetMetadata } from '@nestjs/common';

export const RequireFeature = (featureId: LICENSE_FIELD) => SetMetadata(LICENSE_FEATURE_ID_KEY, featureId);

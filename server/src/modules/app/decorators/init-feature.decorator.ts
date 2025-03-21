import { SetMetadata } from '@nestjs/common';

export const InitFeature = (featureId: any) => SetMetadata('tjFeatureId', featureId);

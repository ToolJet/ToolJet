import { useQuery } from '@tanstack/react-query';

import { licenseService } from '@/_services/license.service';

export function useFetchFeatureAccess() {
  return useQuery({
    queryKey: ['featureAccess'],
    queryFn: licenseService.getFeatureAccess,
  });
}

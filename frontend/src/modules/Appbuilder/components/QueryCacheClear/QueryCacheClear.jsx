import React from 'react';
import { withEditionSpecificComponent } from '@/modules/common/helpers';
// Query response caching is EE only, so CE has nothing to clear.
const QueryCacheClear = () => {
  return <></>;
};
export default withEditionSpecificComponent(QueryCacheClear, 'Appbuilder');

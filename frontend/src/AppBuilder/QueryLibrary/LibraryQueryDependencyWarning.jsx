import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';

function LibraryQueryDependencyWarning() {
  return null;
}
export default withEditionSpecificComponent(LibraryQueryDependencyWarning, 'QueryLibrary');

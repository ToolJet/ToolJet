import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';

function Library() {
  return null;
}
const SelectedLibrary = withEditionSpecificComponent(Library, 'QueryLibrary');
export { SelectedLibrary as Library };

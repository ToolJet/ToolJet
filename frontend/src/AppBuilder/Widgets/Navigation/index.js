import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';

function Navigation() {
  return null;
}

const WrappedNavigation = withEditionSpecificComponent(Navigation, 'Appbuilder');

export { WrappedNavigation as Navigation };

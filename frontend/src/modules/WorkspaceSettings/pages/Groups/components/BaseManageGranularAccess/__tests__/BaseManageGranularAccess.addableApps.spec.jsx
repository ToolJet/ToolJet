import { groupPermissionV2Service } from '@/_services';
import ManageGranularAccess from '../BaseManageGranularAccess';

jest.mock('@/_services', () => ({
  groupPermissionV2Service: {
    fetchAddableApps: jest.fn(() => Promise.resolve([])),
    fetchGranularPermissions: jest.fn(() => Promise.resolve([])),
  },
  authenticationService: { currentSessionValue: { admin: true } },
}));

const BaseManageGranularAccess = ManageGranularAccess.WrappedComponent;

const mount = (props) => {
  const instance = new BaseManageGranularAccess({ groupPermissionId: 'group-1', ...props });
  instance.setState = jest.fn();
  instance.componentDidMount();
  return instance;
};

describe('BaseManageGranularAccess addable apps', () => {
  afterEach(() => jest.clearAllMocks());

  it('should not request addable apps on a paid plan without custom groups', () => {
    mount({ isBasicPlan: false, isFeatureEnabled: false });

    expect(groupPermissionV2Service.fetchAddableApps).not.toHaveBeenCalled();
  });

  it('should request addable apps on a paid plan with custom groups', () => {
    mount({ isBasicPlan: false, isFeatureEnabled: true });

    expect(groupPermissionV2Service.fetchAddableApps).toHaveBeenCalledTimes(1);
  });

  it('should request addable apps once custom groups load after mount', () => {
    const instance = mount({ isBasicPlan: false, isFeatureEnabled: undefined });
    const prevProps = instance.props;
    instance.props = { ...prevProps, isFeatureEnabled: true };
    instance.componentDidUpdate(prevProps);

    expect(groupPermissionV2Service.fetchAddableApps).toHaveBeenCalledTimes(1);
  });
});

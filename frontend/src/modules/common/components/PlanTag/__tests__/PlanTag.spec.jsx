import React from 'react';
import config from 'config';
import { cleanup, render, screen } from '@/test/test-utils';
import { useLicenseStore } from '@/_stores/licenseStore';
import PlanTag from '../PlanTag';

const catalog = {
  plans: [
    { id: 'basic', label: 'Free' },
    { id: 'team', label: 'Team' },
    { id: 'enterprise', label: 'Enterprise' },
  ],
  gates: { gitSync: 'team' },
};

const freeAccess = {
  planTier: 'basic',
  gitSync: false,
  licenseStatus: { licenseType: 'basic', isLicenseValid: false },
};

describe('PlanTag', () => {
  const originalEdition = config.TOOLJET_EDITION;

  beforeEach(() => {
    config.TOOLJET_EDITION = 'ee';
    useLicenseStore.setState({
      featureAccess: freeAccess,
      featuresLoaded: true,
      planCatalog: catalog,
      planCatalogStatus: 'loaded',
    });
  });

  // Unmount before the global afterEach resets the store, or React warns about an update outside act().
  afterEach(cleanup);

  afterAll(() => {
    config.TOOLJET_EDITION = originalEdition;
  });

  it('should name the lowest plan that unlocks a locked feature', () => {
    render(<PlanTag gateKey="gitSync" />);

    expect(screen.getByText('Team plan')).toBeInTheDocument();
  });

  it('should show only a lock with a plan tooltip when icon-only', () => {
    render(<PlanTag gateKey="gitSync" iconOnly featureName="Modules" plural />);

    expect(screen.getByLabelText('Modules are available in Team plan and above')).toBeInTheDocument();
    expect(screen.queryByText('Team plan')).not.toBeInTheDocument();
  });

  it('should be a label, not a control', () => {
    render(<PlanTag gateKey="gitSync" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should render nothing once the feature is available', () => {
    useLicenseStore.setState({ featureAccess: { ...freeAccess, gitSync: true } });

    const { container } = render(<PlanTag gateKey="gitSync" />);

    expect(container).toBeEmptyDOMElement();
  });

  it('should render nothing until the plan catalog has loaded', () => {
    useLicenseStore.setState({ planCatalogStatus: 'loading' });

    const { container } = render(<PlanTag gateKey="gitSync" />);

    expect(container).toBeEmptyDOMElement();
  });

  it('should render only the CE fallback on CE', () => {
    config.TOOLJET_EDITION = 'ce';

    render(<PlanTag gateKey="gitSync" ceFallback={<span>Upgrade your plan</span>} />);

    expect(screen.getByText('Upgrade your plan')).toBeInTheDocument();
    expect(screen.queryByText('Team plan')).not.toBeInTheDocument();
  });
});

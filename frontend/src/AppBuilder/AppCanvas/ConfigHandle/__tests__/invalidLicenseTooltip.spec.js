import { getInvalidLicenseTooltip } from '../utils';

describe('getInvalidLicenseTooltip for SDK-built components', () => {
  it('asks to renew a custom component when the plan has no custom components', () => {
    const tooltip = getInvalidLicenseTooltip({
      componentType: 'LibraryComponent',
      componentName: 'card1',
      hasCustomComponentLibrariesAccess: false,
    });

    expect(tooltip?.html).toContain('Renew to use custom components');
  });

  it('shows nothing for a pack component, which needs no plan', () => {
    // Break this catches: a pack component on a free plan carrying a "plan is expired" tooltip.
    const tooltip = getInvalidLicenseTooltip({
      componentType: 'PackComponent',
      componentName: 'select1',
      hasCustomComponentLibrariesAccess: false,
    });

    expect(tooltip).toBeNull();
  });
});

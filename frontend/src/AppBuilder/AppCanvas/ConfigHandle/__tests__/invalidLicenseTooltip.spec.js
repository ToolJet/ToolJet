import { getInvalidLicenseTooltip } from '../utils';

describe('getInvalidLicenseTooltip for a library component', () => {
  it('asks to renew when the plan has no custom components', () => {
    const tooltip = getInvalidLicenseTooltip({
      componentType: 'LibraryComponent',
      componentName: 'card1',
      hasCustomComponentLibrariesAccess: false,
      libraryCorrelationId: 'lib-uploaded',
    });

    expect(tooltip?.html).toContain('Renew to use custom components');
  });

  it('shows nothing for a built-in pack component, which needs no plan', () => {
    // Break this catches: a built-in pack component on a free plan carrying a "plan is expired" tooltip.
    const tooltip = getInvalidLicenseTooltip({
      componentType: 'LibraryComponent',
      componentName: 'select1',
      hasCustomComponentLibrariesAccess: false,
      libraryCorrelationId: 'builtin:shadcn',
    });

    expect(tooltip).toBeNull();
  });
});

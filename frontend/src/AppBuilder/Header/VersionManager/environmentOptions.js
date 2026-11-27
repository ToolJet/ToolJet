import { hasEnvironmentAccess } from '@/_helpers/environmentAccess';

export function getEnvironmentOptions({
  environments,
  allowEmptyEnvironments = false,
  environmentAccess,
  isWorkflowApp,
  isModuleApp,
  multiEnvironmentEnabled,
  licenseType,
  licenseValid,
}) {
  if (!environments.length) return [];
  const hasProductionVersion = environments.some((env) => env.name === 'production' && env.appVersionsCount > 0);

  return environments.map((environment) => {
    const hasVersions = allowEmptyEnvironments || environment.appVersionsCount > 0 || hasProductionVersion;
    const isHigherPriority = environment.priority > 1;
    const envName = environment.name.toLowerCase();

    // Workflow apps are accessible in all environments regardless of group permissions
    const hasEnvAccess =
      isWorkflowApp || isModuleApp || envName === 'development' || hasEnvironmentAccess(environmentAccess, envName);

    // User access restriction - check if they can access this environment
    const isAccessRestricted = !hasEnvAccess;

    // Check if multi-environment is restricted (feature not enabled, or trial with invalid license)
    const multiEnvRestricted =
      isHigherPriority && (!multiEnvironmentEnabled || (licenseType === 'trial' && !licenseValid));

    // Check if environment is enabled in the license
    const isEnvironmentEnabled = environment.enabled !== false;

    let tooltipMessage = '';
    let showTooltip = false;

    // Priority 1: User doesn't have access to this environment
    if (isAccessRestricted) {
      tooltipMessage = `Access to ${envName} environment is restricted. Contact admin to know more.`;
      showTooltip = true;
    }
    // Priority 2: Show trial tooltip (trial license with valid license trying to access higher envs)
    else if (licenseType === 'trial' && licenseValid && isHigherPriority) {
      tooltipMessage = 'Multi-environments is a paid plan feature';
      showTooltip = true;
    }
    // Priority 3: Show license invalid/expired tooltip (higher envs with invalid license)
    else if (isHigherPriority && !isEnvironmentEnabled && !licenseValid) {
      tooltipMessage = 'Multi-environments are available only in paid plans';
      showTooltip = true;
    }
    // Priority 4: Show feature not available tooltip (higher envs not enabled but license is valid)
    else if (isHigherPriority && !isEnvironmentEnabled && licenseValid) {
      tooltipMessage = 'Multi-environments are not included in your current plan';
      showTooltip = true;
    }
    // Priority 5: No versions in environment
    else if (!hasVersions && isEnvironmentEnabled && hasEnvAccess) {
      tooltipMessage = 'There are no versions in this environment';
      showTooltip = true;
    }

    const disabled = isAccessRestricted || multiEnvRestricted || !isEnvironmentEnabled || !hasVersions;

    const showEnterpriseIcon =
      isHigherPriority && (!multiEnvironmentEnabled || licenseType === 'trial' || !isEnvironmentEnabled);

    return {
      environment,
      disabled,
      tooltipMessage,
      showTooltip,
      showEnterpriseIcon,
    };
  });
}

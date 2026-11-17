import { useHostValidation } from '@/AppBuilder/Widgets/LibraryComponent/usePackHost';

/**
 * A host's useValidation as usePackHost builds it, with an empty Validation section: the component's own rule
 * (ToolJet.useValidation's `rule`) decides isValid, published through `setExposedVariable` like the real host does.
 */
export const hostValidation = (setExposedVariable) => {
  const latest = { current: { validate: () => ({ isValid: true }), validation: {}, setExposedVariable } };
  return (value, present, rule) => useHostValidation(latest, value, present, rule);
};

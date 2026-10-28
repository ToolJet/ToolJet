import { isBuiltinLibrary } from '@/_helpers/builtinPacks';

export interface InvalidLicenseTooltip {
  id: string;
  html: string;
}

interface GetInvalidLicenseTooltipParams {
  componentType?: string;
  componentName?: string;
  isModulesEnabled?: boolean;
  isModuleEditor?: boolean;
  hasCustomComponentLibrariesAccess?: boolean;
  libraryCorrelationId?: string;
}

// A config handle can need at most one of these at a time (componentType picks which) --
// returns the {id, html} pair to wire onto both the trigger's data-tooltip-* attributes
// and the <Tooltip/> that answers them, or null when neither invalid-license case applies.
export const getInvalidLicenseTooltip = ({
  componentType,
  componentName,
  isModulesEnabled,
  isModuleEditor,
  hasCustomComponentLibrariesAccess,
  libraryCorrelationId,
}: GetInvalidLicenseTooltipParams): InvalidLicenseTooltip | null => {
  const isModuleLicenseInvalid =
    (componentType === 'ModuleViewer' || componentType === 'ModuleContainer') && !isModulesEnabled && !isModuleEditor;
  if (isModuleLicenseInvalid) {
    return {
      id: `invalid-license-modules-${componentName?.toLowerCase()}`,
      html: 'Your plan is expired. <br/> Renew to use the modules.',
    };
  }

  // Built-in packs ship with ToolJet like native widgets, in every edition: no licence needed.
  const isLibraryLicenseInvalid =
    componentType === 'LibraryComponent' &&
    !hasCustomComponentLibrariesAccess &&
    !isBuiltinLibrary(libraryCorrelationId);
  if (isLibraryLicenseInvalid) {
    return {
      id: `invalid-license-library-component-${componentName?.toLowerCase()}`,
      html: 'Your plan is expired. <br/> Renew to use custom components.',
    };
  }

  return null;
};

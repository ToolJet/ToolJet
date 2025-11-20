// DEPRECATED: This file is no longer used and can be removed.
//
// Previously, this file statically imported ALL edition modules, causing
// the entire EE/Cloud/CE codebases (~5.4MB) to be bundled in every build,
// even for components that were never used.
//
// The new implementation in withEditionSpecificComponent.jsx uses
// component-level dynamic imports, loading only the specific component
// file needed, resulting in:
// - ~90% smaller viewer bundles
// - No EE code in CE builds
// - Proper code-splitting per component
//
// This file is kept temporarily for reference and will be removed
// after confirming no legacy code depends on it.

// import * as eeModules from '@ee/modules';
// import * as cloudModules from '@cloud/modules';
// import * as ceModules from '@/modules';

// export const editions = {
//   ee: eeModules,
//   cloud: eeModules,
//   ce: ceModules,
// };

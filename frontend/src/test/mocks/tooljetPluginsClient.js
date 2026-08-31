// Frontend unit CI does not build the sibling plugins package. Tests that need
// plugin behavior must provide an explicit fixture instead of loading a bundle.
module.exports = {
  allManifests: {},
  allOperations: {},
  allSvgs: {},
};

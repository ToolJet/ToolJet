/**
 * Mock for the `ibm_db` npm package.
 *
 * Why this exists:
 *   ibm_db is a native C++ addon (`odbc_bindings.node`) that depends on the
 *   DB2 client DLLs bundled in its `installer/clidriver` directory. On
 *   Windows, Jest loads native addons through an extended-length `\\?\...`
 *   path, and the DLL search path ibm_db sets at require time is not honored,
 *   so loading the binding fails with "The specified module could not be
 *   found" even though a plain `require('ibm_db')` works.
 *
 *   The import chain that triggers this:
 *     test-helper.ts -> AppModule -> DataSourcesModule -> PluginsSelectorService
 *     -> @tooljet/plugins/dist/server -> ibmdb plugin -> require('ibm_db')
 *
 *   No server test connects to DB2, so a trivial mock is sufficient. This can
 *   be removed if the binding loads correctly under Jest, or if the server
 *   stops eagerly importing every plugin.
 */

module.exports = {
  open: jest.fn(),
};

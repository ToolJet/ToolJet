// Tests run as the CE edition: @ee/* resolves to the empty module (see
// moduleNameMapper in package.json), mirroring webpack's
// NormalModuleReplacementPlugin behavior for CE builds.
process.env.TOOLJET_EDITION = process.env.TOOLJET_EDITION || 'ce';

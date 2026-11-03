// Runs before each spec file's imports. Code that resolves the edition at import time (getImportPath,
// getTooljetEdition) would otherwise fall back to TOOLJET_EDITION in .env.test, whatever the project is.
process.env.TOOLJET_EDITION = (globalThis as unknown as { tjEdition: string }).tjEdition;

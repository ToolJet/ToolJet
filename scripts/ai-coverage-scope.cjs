// Shared by focused Jest runs, normal coverage, and report validation.
const backend = (edition) => [
  'src/modules/ai/**/*.ts',
  ...(edition === 'ce' ? [] : ['ee/ai/**/*.ts']),
  '!**/module.ts',
  '!**/*.module.ts',
  '!**/*.dto.ts',
  '!**/*.entity.ts',
  '!**/interfaces/**',
  '!**/types/**',
  '!**/*.(spec|test).ts',
];
const frontend = (edition) => [
  'src/_services/ai.service.js',
  'src/_services/ai-onboarding.service.js',
  'src/_services/copilot.service.js',
  'src/_ui/AiBanner.jsx',
  'src/AppBuilder/_helpers/queryDataShape.js',
  'src/AppBuilder/_helpers/componentTargetShape.js',
  'src/AppBuilder/QueryManager/_hooks/useWriteQueryEntry.js',
  'src/AppBuilder/_stores/slices/aiSlice.js',
  'src/AppBuilder/_stores/slices/fixWithAi.js',
  'src/AppBuilder/CodeEditor/FixWithAi.jsx',
  ...(edition === 'ce'
    ? []
    : [
        'ee/modules/AiBuilder/**/*.{js,jsx,ts,tsx}',
        'ee/modules/InstanceSettings/pages/ManageLLMKeyPage/**/*.{js,jsx,ts,tsx}',
        'ee/modules/WorkspaceSettings/components/ApiKeyContainer/**/*.{js,jsx,ts,tsx}',
      ]),
  '!**/__tests__/**',
  '!**/__mocks__/**',
  '!**/*.(spec|test|stories).{js,jsx,ts,tsx}',
  '!**/*.d.ts',
];
module.exports = { backend, frontend };

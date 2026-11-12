import { getMode, resolveSource } from '@modules/app-validation/core/mode';
import { VALIDATION_MODE_BY_SOURCE } from '@modules/app-validation/core/constants';

describe('app-validation mode', () => {
  describe('getMode', () => {
    it('reads the mode for each source from VALIDATION_MODE_BY_SOURCE', () => {
      for (const source of Object.keys(VALIDATION_MODE_BY_SOURCE) as (keyof typeof VALIDATION_MODE_BY_SOURCE)[]) {
        expect(getMode(source)).toBe(VALIDATION_MODE_BY_SOURCE[source]);
      }
    });

    it('enforces PAT writes and keeps every other source on report', () => {
      // Product decision: agent/MCP traffic (PAT) is blocked on invalid writes from day 1,
      // humans and bulk paths stay observe-only until the rollout flips them.
      expect(VALIDATION_MODE_BY_SOURCE.pat).toBe('enforce');
      const otherModes = Object.entries(VALIDATION_MODE_BY_SOURCE)
        .filter(([source]) => source !== 'pat')
        .map(([, mode]) => mode);
      expect(otherModes.every((mode) => mode === 'report')).toBe(true);
    });

    it('applies a per-source mode', () => {
      const modes = { ...VALIDATION_MODE_BY_SOURCE, pat: 'enforce' as const, ui: 'off' as const };
      expect(getMode('pat', modes)).toBe('enforce');
      expect(getMode('ui', modes)).toBe('off');
      expect(getMode('import', modes)).toBe('report');
    });

    it('never lets version copy or history restore block', () => {
      const modes = { ...VALIDATION_MODE_BY_SOURCE, copy: 'enforce' as const, restore: 'off' as const };
      expect(getMode('copy', modes)).toBe('report');
      expect(getMode('restore', modes)).toBe('off');
    });
  });

  describe('resolveSource', () => {
    it('detects PAT sessions (MCP)', () => {
      expect(resolveSource({ user: { tjApiSource: 'personal_access_token' }, originalUrl: '/api/v2/apps/1' })).toBe(
        'pat'
      );
    });

    it('detects the AI builder\u2019s sessions, which must stay on report, not the enforced pat', () => {
      expect(resolveSource({ user: { tjApiSource: 'ai_builder' }, originalUrl: '/api/v2/apps/1' })).toBe('ai');
    });

    it('detects the external API, with or without a sub path', () => {
      expect(resolveSource({ originalUrl: '/api/ext/apps/import' })).toBe('ext_api');
      expect(resolveSource({ originalUrl: '/tooljet/api/ext/users?x=1' })).toBe('ext_api');
    });

    it('defaults to the editor', () => {
      expect(resolveSource({ originalUrl: '/api/v2/apps/1/versions/2/components' })).toBe('ui');
      expect(resolveSource({ originalUrl: '/api/extensions' })).toBe('ui');
      expect(resolveSource(undefined)).toBe('ui');
    });
  });
});

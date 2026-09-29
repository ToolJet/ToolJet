import { getMode, parseModeConfig, resolveSource } from '@modules/app-validation/mode';

describe('app-validation mode', () => {
  describe('parseModeConfig / getMode', () => {
    it('defaults every source to report', () => {
      expect(getMode('pat', undefined)).toBe('report');
      expect(getMode('ui', '')).toBe('report');
    });

    it('applies a single mode to every source', () => {
      expect(getMode('ui', 'enforce')).toBe('enforce');
      expect(getMode('import', 'off')).toBe('off');
    });

    it('supports per-source modes with a fallback', () => {
      const raw = 'pat=enforce, ext_api=report, *=off';
      expect(getMode('pat', raw)).toBe('enforce');
      expect(getMode('ext_api', raw)).toBe('report');
      expect(getMode('ui', raw)).toBe('off');
    });

    it('never lets version copy or history restore block, even when set to enforce', () => {
      expect(getMode('copy', 'enforce')).toBe('report');
      expect(getMode('restore', 'restore=enforce')).toBe('report');
      expect(getMode('restore', 'off')).toBe('off');
      expect(getMode('import', 'enforce')).toBe('enforce');
    });

    it('ignores unknown sources and modes', () => {
      expect(parseModeConfig('pat=block,robots=enforce,ui=enforce')).toEqual({ ui: 'enforce' });
      expect(getMode('pat', 'pat=block')).toBe('report');
    });
  });

  describe('resolveSource', () => {
    it('detects PAT sessions (MCP)', () => {
      expect(resolveSource({ user: { tjApiSource: 'personal_access_token' }, originalUrl: '/api/v2/apps/1' })).toBe(
        'pat'
      );
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

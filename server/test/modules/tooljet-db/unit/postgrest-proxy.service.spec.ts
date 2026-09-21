/** @group database */
import { extractAndStripEnvironmentId } from '@modules/tooljet-db/services/postgrest-proxy.service';

const UUID = '11111111-1111-4111-8111-111111111111';

describe('extractAndStripEnvironmentId', () => {
  it('should return the url unchanged when there is no querystring', () => {
    expect(extractAndStripEnvironmentId(`/${UUID}`)).toEqual({ url: `/${UUID}`, environmentId: undefined });
  });

  it('should return the url unchanged when environment_id is absent', () => {
    expect(extractAndStripEnvironmentId(`/${UUID}?select=name,gpa`)).toEqual({
      url: `/${UUID}?select=name,gpa`,
      environmentId: undefined,
    });
  });

  it('should extract environment_id and strip it, leaving other params untouched', () => {
    expect(extractAndStripEnvironmentId(`/${UUID}?select=name,gpa&environment_id=${UUID}`)).toEqual({
      url: `/${UUID}?select=name,gpa`,
      environmentId: UUID,
    });
  });

  it('should leave the rest of the querystring exactly as-is, including unencoded PostgREST operator syntax', () => {
    expect(extractAndStripEnvironmentId(`/${UUID}?id=in.(1,2,3)&environment_id=${UUID}&order=name.asc`)).toEqual({
      url: `/${UUID}?id=in.(1,2,3)&order=name.asc`,
      environmentId: UUID,
    });
  });

  it('should drop the querystring entirely when environment_id was the only param', () => {
    expect(extractAndStripEnvironmentId(`/${UUID}?environment_id=${UUID}`)).toEqual({
      url: `/${UUID}`,
      environmentId: UUID,
    });
  });

  it('should pass a user column filter through untouched when the table has its own "environment_id" column', () => {
    // PostgREST filter syntax always prefixes the value with an operator - `eq.5` here can never be
    // a real environment id (a bare uuid), only a filter on a same-named column. Must not be
    // stripped, and must not be mistaken for our internal routing param.
    expect(extractAndStripEnvironmentId(`/${UUID}?select=name&environment_id=eq.5`)).toEqual({
      url: `/${UUID}?select=name&environment_id=eq.5`,
      environmentId: undefined,
    });
  });

  it('should still resolve the real environment_id when a user column filter of the same name is also present', () => {
    expect(extractAndStripEnvironmentId(`/${UUID}?environment_id=eq.5&environment_id=${UUID}&select=name`)).toEqual({
      url: `/${UUID}?environment_id=eq.5&select=name`,
      environmentId: UUID,
    });
  });
});

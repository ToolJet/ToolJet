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
});

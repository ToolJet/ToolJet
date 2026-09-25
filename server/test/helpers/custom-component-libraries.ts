/**
 * Custom Component Libraries (CCL) test helpers -- entity factories, PAT minting,
 * and multipart fixture builders shared by the unit and e2e specs.
 */
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { CustomComponentLibrary } from '@entities/custom_component_library.entity';
import { CustomComponentLibraryRevision } from '@entities/custom_component_library_revision.entity';
import { CustomComponentDevBundle } from '@entities/custom_component_dev_bundle.entity';
import { saveEntity } from './utils';

/** Creates a CustomComponentLibrary row directly (bypassing the HTTP/service layer). */
export async function createLibrary(
  organizationId: string,
  overrides: Partial<CustomComponentLibrary> = {}
): Promise<CustomComponentLibrary> {
  return saveEntity(CustomComponentLibrary, { organizationId, name: `library-${Date.now()}`, ...overrides } as any);
}

/** Creates a CustomComponentLibraryRevision row for a given library. */
export async function createLibraryRevision(
  libraryId: string,
  overrides: Partial<CustomComponentLibraryRevision> = {}
): Promise<CustomComponentLibraryRevision> {
  return saveEntity(CustomComponentLibraryRevision, {
    libraryId,
    version: '1.0.0',
    bundleUrl: `${libraryId}/1.0.0/index.js`,
    manifest: buildManifest(),
    ...overrides,
  } as any);
}

/** Creates a CustomComponentDevBundle row for a given library/user pair. */
export async function createDevBundle(
  libraryId: string,
  userId: string,
  overrides: Partial<CustomComponentDevBundle> = {}
): Promise<CustomComponentDevBundle> {
  return saveEntity(CustomComponentDevBundle, {
    libraryId,
    userId,
    bundleUrl: `${libraryId}/dev/${userId}/index.js`,
    manifest: buildManifest(),
    uploadedAt: new Date(),
    ...overrides,
  } as any);
}

/** A minimal manifest with at least one component, as required by parseUploadFiles. */
export function buildManifest(componentName = 'MyComponent'): Record<string, any> {
  return { components: { [componentName]: { name: componentName, properties: {} } } };
}

export const BUNDLE_JS = Buffer.from('module.exports = {};');
export const BUNDLE_CSS = Buffer.from('.my-component { color: red; }');

/**
 * Mints a workspace PAT through the real API (POST /api/personal-access-tokens) and
 * returns the raw token string. CCL's PatAuthGuard reads the raw bearer token directly --
 * no session-exchange step needed, unlike the CLI login flow.
 */
export async function createPat(
  app: INestApplication,
  cookie: string[],
  organizationId: string,
  name = `pat-${Date.now()}`
): Promise<string> {
  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const res = await request
    .agent(app.getHttpServer())
    .post('/api/personal-access-tokens')
    .set('Cookie', cookie)
    .set('tj-workspace-id', organizationId)
    .send({ name, organizationId, expiresAt: futureDate });

  if (res.status !== 201) {
    throw new Error(`createPat expected 201, got ${res.status}: ${JSON.stringify(res.body)}`);
  }
  return res.body.token;
}

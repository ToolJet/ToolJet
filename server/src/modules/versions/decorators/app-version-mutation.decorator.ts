import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { ValidAppGuard } from '@modules/apps/guards/valid-app.guard';
import { FeatureAbilityGuard } from '../ability/guard';
import { MutableAppVersionGuard } from '@modules/apps/guards/mutable-app-version.guard';
import { GitSyncEditGuard } from '../guards/git-sync-edit.guard';

/**
 * Canonical guard stack for a version-content mutation (components, pages, …). Bundling it in one
 * decorator keeps every mutation route in lock-step: a new route gets the released-version freeze
 * by construction instead of relying on each author to remember MutableAppVersionGuard.
 *
 * Order matters:
 *   1. JwtAuthGuard          — authenticate.
 *   2. ValidAppGuard         — resolve the app (request.tj_app) + its target version.
 *   3. FeatureAbilityGuard   — authorize. MUST precede the business rules below so an unauthorized
 *                              caller gets 403, not the 400 the freeze checks would return (which
 *                              would also leak release state).
 *   4. MutableAppVersionGuard — reject edits to the released version (App.currentVersionId).
 *   5. GitSyncEditGuard      — git-sync branch/lock rules.
 *
 * EE overrides these routes to bind the EE GitSyncEditGuard; see the EE counterpart of this file.
 */
export function AppVersionMutation() {
  return applyDecorators(
    UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard, MutableAppVersionGuard, GitSyncEditGuard)
  );
}

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { dbTransactionWrap } from '@helpers/database.helper';
import { App } from '@entities/app.entity';
import { User } from '@entities/user.entity';
import { VersionDiffService } from '../diff/version-diff.service';
import { buildSnapshot } from '../diff/snapshot';
import { contentFingerprint } from '../diff/fingerprint';
import { diffVersions } from '../diff/version-diff';
import { ReviewEvent, reviewState } from './review-state';

// Which actions need an approved review. Off unless the instance opts in, so
// existing workspaces keep releasing as before. A workspace setting would
// replace this env var in the product.
// Values: off (default), release, or release,promote (or all), where promote
// means promoting into production.
export const reviewPolicy = () => {
  const parts = (process.env.TOOLJET_VERSION_REVIEW_REQUIRED || 'off')
    .toLowerCase()
    .split(',')
    .map((part) => part.trim());
  return {
    release: parts.includes('release') || parts.includes('all'),
    promote: parts.includes('promote') || parts.includes('all'),
    // A typo here must not make reviews impossible to approve.
    requiredApprovals: Math.max(1, Math.floor(Number(process.env.TOOLJET_VERSION_REVIEW_APPROVALS)) || 1),
  };
};

type ReviewRowRaw = {
  id: string;
  appId: string;
  versionId: string;
  baseVersionId: string | null;
  authorId: string;
  title: string;
  description: string | null;
  status: 'open' | 'released' | 'closed';
  requiredApprovals: number;
  createdAt: string;
  updatedAt: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Two requests racing past the "already open" check meet the partial unique index instead.
const ONE_OPEN_INDEX = 'app_version_reviews_one_open';
const isOneOpenViolation = (error: any) =>
  error?.code === '23505' || error?.driverError?.code === '23505' || String(error?.message).includes(ONE_OPEN_INDEX);

const REVIEW_COLUMNS = `r.id, r.app_id AS "appId", r.version_id AS "versionId", r.base_version_id AS "baseVersionId",
  r.author_id AS "authorId", r.title, r.description, r.status, r.required_approvals AS "requiredApprovals",
  r.created_at AS "createdAt", r.updated_at AS "updatedAt"`;

@Injectable()
export class VersionReviewService {
  private readonly diffs = new VersionDiffService();

  async fingerprint(manager: EntityManager, appId: string, versionId: string) {
    return contentFingerprint(buildSnapshot(await this.diffs.loadRows(manager, appId, versionId)));
  }

  private async people(manager: EntityManager, ids: string[]) {
    if (!ids.length) return {};
    const rows = await manager.query(
      `SELECT id, first_name AS "firstName", last_name AS "lastName", email FROM users WHERE id = ANY($1::uuid[])`,
      [[...new Set(ids)]]
    );
    return Object.fromEntries(
      rows.map((row) => [
        row.id,
        { id: row.id, name: [row.firstName, row.lastName].filter(Boolean).join(' ') || row.email, email: row.email },
      ])
    );
  }

  private async events(manager: EntityManager, reviewIds: string[]): Promise<Record<string, ReviewEvent[]>> {
    if (!reviewIds.length) return {};
    const rows = await manager.query(
      `SELECT id, review_id AS "reviewId", actor_id AS "actorId", kind, body, anchor, fingerprint, created_at AS "createdAt"
         FROM app_version_review_events WHERE review_id = ANY($1::uuid[]) ORDER BY created_at, id`,
      [reviewIds]
    );
    const out: Record<string, ReviewEvent[]> = {};
    for (const row of rows) (out[row.reviewId] ??= []).push(row);
    return out;
  }

  // Review plus its derived state, the people involved and a short diff
  // summary, which is everything the review panel draws.
  private async present(manager: EntityManager, app: App, rows: ReviewRowRaw[], withTimeline: boolean) {
    const eventsByReview = await this.events(
      manager,
      rows.map((row) => row.id)
    );
    const fingerprints = new Map<string, string>();
    for (const row of rows) {
      if (!fingerprints.has(row.versionId))
        fingerprints.set(row.versionId, await this.fingerprint(manager, app.id, row.versionId));
    }
    const names = await manager.query(`SELECT id, name, status FROM app_versions WHERE app_id = $1`, [app.id]);
    const versionName = Object.fromEntries(names.map((row) => [row.id, row.name]));
    const actorIds = rows.flatMap((row) => [
      row.authorId,
      ...(eventsByReview[row.id] ?? []).map((event) => event.actorId),
    ]);
    const people = await this.people(manager, actorIds);
    return rows.map((row) => {
      const events = eventsByReview[row.id] ?? [];
      const state = reviewState(row, events, fingerprints.get(row.versionId));
      return {
        ...row,
        versionName: versionName[row.versionId] ?? null,
        baseVersionName: row.baseVersionId ? (versionName[row.baseVersionId] ?? null) : null,
        author: people[row.authorId] ?? { id: row.authorId },
        state,
        commentCount: events.filter((event) => event.kind === 'comment').length,
        ...(withTimeline
          ? {
              people,
              timeline: events.map((event, index) => ({
                ...event,
                stale: !!event.fingerprint && event.fingerprint !== fingerprints.get(row.versionId),
                // Decisions made before the latest reopen no longer count.
                superseded: events.slice(index + 1).some((later) => later.kind === 'reopened'),
              })),
            }
          : {}),
      };
    });
  }

  async list(app: App, status?: string) {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const rows: ReviewRowRaw[] = await manager.query(
        `SELECT ${REVIEW_COLUMNS} FROM app_version_reviews r WHERE r.app_id = $1 ${status ? 'AND r.status = $2' : ''}
          ORDER BY r.created_at DESC LIMIT 50`,
        status ? [app.id, status] : [app.id]
      );
      return { reviews: await this.present(manager, app, rows, false), policy: reviewPolicy() };
    });
  }

  async get(app: App, reviewId: string) {
    return dbTransactionWrap((manager: EntityManager) => this.getWith(manager, app, reviewId));
  }

  private async getWith(manager: EntityManager, app: App, reviewId: string) {
    const row = await this.row(manager, app, reviewId);
    const [review] = await this.present(manager, app, [row], true);
    let summary = null;
    if (row.baseVersionId) {
      const [base, target] = await Promise.all([
        this.diffs.snapshot(manager, app.id, row.baseVersionId),
        this.diffs.snapshot(manager, app.id, row.versionId),
      ]);
      summary = diffVersions(base, target).summary;
    }
    return { review: { ...review, summary }, policy: reviewPolicy() };
  }

  private async row(manager: EntityManager, app: App, reviewId: string): Promise<ReviewRowRaw> {
    const [row] = await manager.query(
      `SELECT ${REVIEW_COLUMNS} FROM app_version_reviews r WHERE r.id = $1 AND r.app_id = $2`,
      [reviewId, app.id]
    );
    if (!row) throw new NotFoundException('Review not found');
    return row;
  }

  async open(
    app: App,
    user: User,
    versionId: string,
    body: { title?: string; description?: string; baseVersionId?: string }
  ) {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const [version] = await manager.query(`SELECT id, name FROM app_versions WHERE id = $1 AND app_id = $2`, [
        versionId,
        app.id,
      ]);
      if (!version) throw new NotFoundException('Version not found');
      const [existing] = await manager.query(
        `SELECT id FROM app_version_reviews WHERE version_id = $1 AND status = 'open'`,
        [versionId]
      );
      if (existing) throw new BadRequestException(`${version.name} already has an open review`);
      // Default comparison: what users run today.
      const [{ currentVersionId }] = await manager.query(
        `SELECT current_version_id AS "currentVersionId" FROM apps WHERE id = $1`,
        [app.id]
      );
      const baseVersionId = body.baseVersionId || (currentVersionId !== versionId ? currentVersionId : null);
      if (body.baseVersionId) {
        // The base must be a version of this app; anything else would make the review unreadable for good.
        const [base] = UUID.test(body.baseVersionId)
          ? await manager.query(`SELECT id FROM app_versions WHERE id = $1 AND app_id = $2`, [
              body.baseVersionId,
              app.id,
            ])
          : [];
        if (!base) throw new BadRequestException('Compare against a version of this app');
        if (body.baseVersionId === versionId) throw new BadRequestException('Compare against another version');
      }
      const [{ id }] = await manager
        .query(
          `INSERT INTO app_version_reviews (organization_id, app_id, version_id, base_version_id, author_id, title, description, required_approvals)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
          [
            user.organizationId,
            app.id,
            versionId,
            baseVersionId,
            user.id,
            (body.title || `Release ${version.name}`).slice(0, 200),
            body.description || null,
            reviewPolicy().requiredApprovals,
          ]
        )
        .catch((error) => {
          if (isOneOpenViolation(error)) throw new BadRequestException(`${version.name} already has an open review`);
          throw error;
        });
      await this.addEvent(
        manager,
        id,
        user.id,
        'opened',
        null,
        null,
        await this.fingerprint(manager, app.id, versionId)
      );
      const [review] = await this.present(manager, app, [await this.row(manager, app, id)], true);
      return { review };
    });
  }

  private async addEvent(
    manager: EntityManager,
    reviewId: string,
    actorId: string,
    kind: ReviewEvent['kind'],
    body: string | null,
    anchor: string | null,
    fingerprint: string | null
  ) {
    await manager.query(
      `INSERT INTO app_version_review_events (review_id, actor_id, kind, body, anchor, fingerprint) VALUES ($1, $2, $3, $4, $5, $6)`,
      [reviewId, actorId, kind, body, anchor, fingerprint]
    );
    await manager.query(`UPDATE app_version_reviews SET updated_at = now() WHERE id = $1`, [reviewId]);
  }

  async comment(app: App, user: User, reviewId: string, body: { body?: string; anchor?: string }) {
    if (!body.body?.trim()) throw new BadRequestException('Write a comment first');
    return dbTransactionWrap(async (manager: EntityManager) => {
      const row = await this.row(manager, app, reviewId);
      await this.addEvent(
        manager,
        reviewId,
        user.id,
        'comment',
        body.body.trim(),
        body.anchor || null,
        await this.fingerprint(manager, app.id, row.versionId)
      );
      return this.getWith(manager, app, reviewId);
    });
  }

  // An approval names the exact content the reviewer looked at (the fingerprint the
  // compare view showed). If the version changed in between, the approval is refused
  // rather than attached to content nobody reviewed.
  async decide(
    app: App,
    user: User,
    reviewId: string,
    body: { decision?: string; body?: string; fingerprint?: string }
  ) {
    const kinds = { approve: 'approved', request_changes: 'changes_requested', dismiss: 'dismissed' } as const;
    const kind = kinds[body.decision];
    if (!kind) throw new BadRequestException('decision must be approve, request_changes or dismiss');
    return dbTransactionWrap(async (manager: EntityManager) => {
      const row = await this.row(manager, app, reviewId);
      if (row.status !== 'open') throw new BadRequestException(`This review is ${row.status}`);
      if (row.authorId === user.id && kind !== 'dismissed')
        throw new ForbiddenException('You opened this review, so someone else has to approve it');
      if (kind === 'changes_requested' && !body.body?.trim()) throw new BadRequestException('Say what needs to change');
      const current = await this.fingerprint(manager, app.id, row.versionId);
      if (kind === 'approved') {
        if (!body.fingerprint)
          throw new BadRequestException('Approve from the compare view, which says what you reviewed');
        if (body.fingerprint !== current)
          throw new ConflictException(
            'The version changed after you opened it. Reload the changes and review them again.'
          );
      }
      await this.addEvent(manager, reviewId, user.id, kind, body.body?.trim() || null, null, current);
      return this.getWith(manager, app, reviewId);
    });
  }

  async override(app: App, user: User, reviewId: string, body: { reason?: string }) {
    if (!body.reason?.trim() || body.reason.trim().length < 10)
      throw new BadRequestException('Give a reason for releasing without approval (at least 10 characters)');
    return dbTransactionWrap(async (manager: EntityManager) => {
      const row = await this.row(manager, app, reviewId);
      if (row.status !== 'open') throw new BadRequestException(`This review is ${row.status}`);
      await this.addEvent(
        manager,
        reviewId,
        user.id,
        'override',
        body.reason.trim(),
        null,
        await this.fingerprint(manager, app.id, row.versionId)
      );
      return this.getWith(manager, app, reviewId);
    });
  }

  async close(app: App, user: User, reviewId: string, reopen = false) {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const row = await this.row(manager, app, reviewId);
      if (reopen ? row.status !== 'closed' : row.status !== 'open')
        throw new BadRequestException(`This review is ${row.status}`);
      if (reopen) {
        const [other] = await manager.query(
          `SELECT id FROM app_version_reviews WHERE version_id = $1 AND status = 'open' AND id <> $2`,
          [row.versionId, reviewId]
        );
        if (other) throw new BadRequestException('This version already has another open review');
      }
      await manager.query(`UPDATE app_version_reviews SET status = $2 WHERE id = $1`, [
        reviewId,
        reopen ? 'open' : 'closed',
      ]);
      await this.addEvent(
        manager,
        reviewId,
        user.id,
        reopen ? 'reopened' : 'closed',
        null,
        null,
        await this.fingerprint(manager, app.id, row.versionId)
      );
      return this.getWith(manager, app, reviewId);
    });
  }

  // Whether a version may be released now, and why not.
  async gate(manager: EntityManager, appId: string, versionId: string, action: 'release' | 'promote' = 'release') {
    const policy = reviewPolicy();
    if (!policy[action]) return { required: false, allowed: true, reason: null, reviewId: null };
    // Reviews exist for apps only: workflows and modules have no compare view to review in,
    // so gating them would make them impossible to release.
    const [app] = await manager.query(`SELECT type FROM apps WHERE id = $1`, [appId]);
    if (app && app.type !== 'front-end') return { required: false, allowed: true, reason: null, reviewId: null };
    const verb = action === 'promote' ? 'promoted to production' : 'released';
    const [row]: ReviewRowRaw[] = await manager.query(
      `SELECT ${REVIEW_COLUMNS} FROM app_version_reviews r WHERE r.version_id = $1 AND r.app_id = $2 AND r.status = 'open'
        ORDER BY r.created_at DESC LIMIT 1`,
      [versionId, appId]
    );
    if (!row) {
      // Rolling back: a version whose last review was released can go out again
      // as long as its content is still exactly what was approved.
      const [released]: ReviewRowRaw[] = await manager.query(
        `SELECT ${REVIEW_COLUMNS} FROM app_version_reviews r WHERE r.version_id = $1 AND r.app_id = $2 AND r.status = 'released'
          ORDER BY r.updated_at DESC LIMIT 1`,
        [versionId, appId]
      );
      if (released) {
        const events = (await this.events(manager, [released.id]))[released.id] ?? [];
        const current = await this.fingerprint(manager, appId, versionId);
        const state = reviewState({ ...released, status: 'open' }, events, current);
        if (state.canRelease) return { required: true, allowed: true, reason: null, reviewId: released.id, state };
      }
      return {
        required: true,
        allowed: false,
        reason: `This version needs an approved review before it can be ${verb}`,
        reviewId: null,
      };
    }
    const events = (await this.events(manager, [row.id]))[row.id] ?? [];
    const state = reviewState(row, events, await this.fingerprint(manager, appId, versionId));
    const reason = state.canRelease
      ? null
      : state.status === 'changes_requested'
        ? 'A reviewer asked for changes'
        : state.staleApprovals.length && !state.approvals.length
          ? 'The version changed after it was approved, so it needs a fresh approval'
          : `Waiting for ${state.needed} more approval${state.needed === 1 ? '' : 's'}`;
    return { required: true, allowed: state.canRelease, reason, reviewId: row.id, state };
  }

  async gateFor(app: App, versionId: string) {
    return dbTransactionWrap((manager: EntityManager) => this.gate(manager, app.id, versionId));
  }

  // Called from the release path, inside its transaction.
  async assertReleasable(
    manager: EntityManager,
    appId: string,
    versionId: string,
    action: 'release' | 'promote' = 'release'
  ) {
    const gate = await this.gate(manager, appId, versionId, action);
    if (!gate.allowed) throw new ForbiddenException(gate.reason);
    return gate;
  }

  async markReleased(manager: EntityManager, appId: string, versionId: string, userId: string) {
    const result = await manager.query(
      `UPDATE app_version_reviews SET status = 'released', updated_at = now()
        WHERE app_id = $1 AND version_id = $2 AND status = 'open' RETURNING id`,
      [appId, versionId]
    );
    // The postgres driver answers UPDATE ... RETURNING with [rows, count].
    const rows: Array<{ id: string }> = Array.isArray(result?.[0]) ? result[0] : result;
    for (const { id } of rows)
      await this.addEvent(
        manager,
        id,
        userId,
        'released',
        null,
        null,
        await this.fingerprint(manager, appId, versionId)
      );
  }
}

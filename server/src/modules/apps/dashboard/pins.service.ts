import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { User } from '@entities/user.entity';
import { dbTransactionWrap } from '@helpers/database.helper';
import { DashboardService } from './dashboard.service';
import { PinKind } from './queries';
import { CreatePinsDto, PinRefDto, ReorderPinsDto, UnpinParamsDto } from './dto/pins.dto';

// Column whitelist — the only identifier interpolated into pin SQL.
const PIN_COLUMN: Record<PinKind, 'app_id' | 'folder_id'> = { app: 'app_id', folder: 'folder_id' };

// A type's pins on a branch; folder pins resolve their type through folders.type.
const PINS_OF_TYPE = `SELECT p.id, p.app_id, p.folder_id, p.position FROM pinned_items p
  LEFT JOIN apps a ON a.id = p.app_id
  LEFT JOIN folders f ON f.id = p.folder_id
  WHERE p.user_id = $1 AND p.branch_id = $2
    AND COALESCE(a.type::text, f.type::text) = $3
  ORDER BY p.position, p.id`;

export interface CurrentPin {
  id: string;
  app_id: string | null;
  folder_id: string | null;
  position: number;
}

const pinKey = (kind: PinKind, id: string) => `${kind}:${id}`;

// Reorder one type's pins by handing their existing position slots out in the new order, so
// other types' pins (same table, same branch) keep their positions. Null = set mismatch.
export function planReorder(
  current: CurrentPin[],
  requested: PinRefDto[]
): { ids: string[]; positions: number[] } | null {
  const byKey = new Map(
    current.map((pin) => [pin.app_id ? pinKey('app', pin.app_id) : pinKey('folder', pin.folder_id), pin])
  );
  const keys = requested.map((ref) => pinKey(ref.resource_type, ref.resource_id));
  if (keys.length !== byKey.size || new Set(keys).size !== keys.length || keys.some((key) => !byKey.has(key)))
    return null;
  const positions = current.map((pin) => pin.position).sort((a, b) => a - b);
  return { ids: keys.map((key) => byKey.get(key).id), positions };
}

@Injectable()
export class PinsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly dashboardService: DashboardService
  ) {}

  // Already-pinned and invisible ids are ignored, so a repeat call is a no-op.
  async pin(user: User, dto: CreatePinsDto): Promise<void> {
    const branchId = await this.dashboardService.resolveBranchId(user, dto.branch_id);
    const visible = await this.dashboardService.filterVisible(user, dto.resource_type, dto.resource_ids, branchId);
    const ids = dto.resource_ids.filter((id) => visible.has(id));
    if (ids.length === 0) return;
    // ponytail: MAX+1 without a lock; concurrent pins may tie on position (ties fall through to the mode order).
    // Conflicting (already-pinned) rows leave a gap in positions; only relative order matters.
    await this.dataSource.query(
      `INSERT INTO pinned_items (user_id, branch_id, ${PIN_COLUMN[dto.resource_type]}, position)
       SELECT $1, $2, r.id,
              (SELECT COALESCE(MAX(position), -1) FROM pinned_items WHERE user_id = $1 AND branch_id = $2) + r.ord
       FROM unnest($3::uuid[]) WITH ORDINALITY AS r(id, ord)
       ON CONFLICT DO NOTHING`,
      [user.id, branchId, ids]
    );
  }

  async unpin(user: User, params: UnpinParamsDto, branchId?: string): Promise<void> {
    const resolved = await this.dashboardService.resolveBranchId(user, branchId);
    await this.dataSource.query(
      `DELETE FROM pinned_items WHERE user_id = $1 AND branch_id = $2 AND ${PIN_COLUMN[params.resource_type]} = $3`,
      [user.id, resolved, params.resource_id]
    );
  }

  // Visibility (permission resolve + CTE query) runs before the transaction, so row locks are held
  // only for lock + plan + update. A pin added in between isn't in `visible` and keeps its slot;
  // one removed in between drops out of `current` and the set check answers 400.
  async reorder(user: User, dto: ReorderPinsDto): Promise<void> {
    const branchId = await this.dashboardService.resolveBranchId(user, dto.branch_id);
    const params = [user.id, branchId, dto.type];
    const snapshot: CurrentPin[] = await this.dataSource.query(PINS_OF_TYPE, params);
    const ids = (column: 'app_id' | 'folder_id') =>
      snapshot.map((pin) => pin[column]).filter((id): id is string => !!id);
    // Hidden pins (lost access / unreleased) aren't in the list, so the client can't send them; they keep their slots.
    const visible = await this.dashboardService.visibleIds(user, dto.type, branchId, {
      app: ids('app_id'),
      folder: ids('folder_id'),
    });
    await dbTransactionWrap(async (manager: EntityManager) => {
      const current: CurrentPin[] = await manager.query(`${PINS_OF_TYPE} FOR UPDATE OF p`, params);
      const plan = planReorder(
        current.filter((pin) => visible.has(pin.app_id ?? pin.folder_id)),
        dto.items
      );
      if (!plan) throw new BadRequestException('Pinned items changed; refetch and retry');
      await manager.query(
        `UPDATE pinned_items p SET position = v.position
         FROM unnest($1::uuid[], $2::int[]) AS v(id, position) WHERE p.id = v.id`,
        [plan.ids, plan.positions]
      );
    });
  }
}

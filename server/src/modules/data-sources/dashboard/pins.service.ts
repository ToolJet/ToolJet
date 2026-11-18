import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { User } from '@entities/user.entity';
import { dbTransactionWrap } from '@helpers/database.helper';
import { DATA_SOURCE_FOLDER_TYPE } from '@modules/folders/constants';
import { DataSourcesDashboardService } from './dashboard.service';
import { PinKind } from './queries';
import { CreatePinsDto, PinRefDto, ReorderPinsDto, UnpinParamsDto } from './dto/pins.dto';

// Column whitelist — the only identifier interpolated into pin SQL.
const PIN_COLUMN: Record<PinKind, 'data_source_id' | 'folder_id'> = {
  data_source: 'data_source_id',
  folder: 'folder_id',
};

// The data-source dashboard's own pins: rows with data_source_id set, or folder_id pointing at a
// data-source folder. Other pins (apps / app folders) share the same table but are never touched.
const PINS_OF_DATA_SOURCE_PAGE = `SELECT p.id, p.data_source_id, p.folder_id, p.position FROM pinned_items p
  LEFT JOIN folders f ON f.id = p.folder_id
  WHERE p.user_id = $1 AND p.branch_id = $2 AND (p.data_source_id IS NOT NULL OR f.type = $3)
  ORDER BY p.position, p.id`;

export interface CurrentPin {
  id: string;
  data_source_id: string | null;
  folder_id: string | null;
  position: number;
}

const pinKey = (kind: PinKind, id: string) => `${kind}:${id}`;

// Null = set mismatch.
export function planReorder(
  current: CurrentPin[],
  requested: PinRefDto[]
): { ids: string[]; positions: number[] } | null {
  const byKey = new Map(
    current.map((pin) => [
      pin.data_source_id ? pinKey('data_source', pin.data_source_id) : pinKey('folder', pin.folder_id),
      pin,
    ])
  );
  const keys = requested.map((ref) => pinKey(ref.resource_type, ref.resource_id));
  if (keys.length !== byKey.size || new Set(keys).size !== keys.length || keys.some((key) => !byKey.has(key)))
    return null;
  const positions = current.map((pin) => pin.position).sort((a, b) => a - b);
  return { ids: keys.map((key) => byKey.get(key).id), positions };
}

@Injectable()
export class DataSourcesPinsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly dashboardService: DataSourcesDashboardService
  ) {}

  async pin(user: User, dto: CreatePinsDto): Promise<void> {
    const branchId = await this.dashboardService.resolveBranchId(user, dto.branch_id);
    const pinIds = { data_source: [], folder: [] } as Record<PinKind, string[]>;
    pinIds[dto.resource_type] = dto.resource_ids;
    const visible = await this.dashboardService.visibleIds(user, branchId, pinIds);
    const ids = dto.resource_ids.filter((id) => visible.has(id));
    if (ids.length === 0) return;
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

  // Visibility runs outside the txn to keep row locks short: pins added meanwhile keep their slot, removed ones → 400.
  async reorder(user: User, dto: ReorderPinsDto): Promise<void> {
    const branchId = await this.dashboardService.resolveBranchId(user, dto.branch_id);
    const params = [user.id, branchId, DATA_SOURCE_FOLDER_TYPE];
    const snapshot: CurrentPin[] = await this.dataSource.query(PINS_OF_DATA_SOURCE_PAGE, params);
    const ids = (column: 'data_source_id' | 'folder_id') =>
      snapshot.map((pin) => pin[column]).filter((id): id is string => !!id);
    const visible = await this.dashboardService.visibleIds(user, branchId, {
      data_source: ids('data_source_id'),
      folder: ids('folder_id'),
    });
    await dbTransactionWrap(async (manager: EntityManager) => {
      const current: CurrentPin[] = await manager.query(`${PINS_OF_DATA_SOURCE_PAGE} FOR UPDATE OF p`, params);
      const plan = planReorder(
        current.filter((pin) => visible.has(pin.data_source_id ?? pin.folder_id)),
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

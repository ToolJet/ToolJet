/** @group platform */
import { ComponentsService } from '@modules/apps/services/component.service';
import { Component } from 'src/entities/component.entity';
import { Layout } from 'src/entities/layout.entity';

const CONTAINER_ID = 'module-container';

type LayoutRow = { id: string; componentId: string; type: 'desktop' | 'mobile'; top: number; height: number };

function makeManager(childIds: string[], layouts: LayoutRow[]) {
  return {
    find: jest.fn(async (entity, options) => {
      if (entity === Component) return childIds.map((id) => ({ id }));
      const where = options.where.componentId;
      if (typeof where === 'string') return layouts.filter((layout) => layout.componentId === where);
      const ids: string[] = where._value;
      return layouts.filter((layout) => ids.includes(layout.componentId));
    }),
    update: jest.fn(),
  };
}

const fit = (manager: ReturnType<typeof makeManager>) =>
  (new ComponentsService({} as never) as unknown as {
    fitModuleContainerToChildren: (id: string, m: unknown) => Promise<void>;
  }).fitModuleContainerToChildren(CONTAINER_ID, manager);

describe('ComponentsService', () => {
  describe('fitModuleContainerToChildren | module apps', () => {
    it('should grow the container to the lowest child bottom plus padding', async () => {
      const manager = makeManager(
        ['card'],
        [
          { id: 'c-desktop', componentId: CONTAINER_ID, type: 'desktop', top: 50, height: 310 },
          { id: 'card-desktop', componentId: 'card', type: 'desktop', top: 430, height: 245 },
        ]
      );

      await fit(manager);

      expect(manager.update).toHaveBeenCalledWith(Layout, { id: 'c-desktop' }, { height: 685 });
    });

    it('should not shrink a container that already holds its children', async () => {
      const manager = makeManager(
        ['card'],
        [
          { id: 'c-desktop', componentId: CONTAINER_ID, type: 'desktop', top: 0, height: 900 },
          { id: 'card-desktop', componentId: 'card', type: 'desktop', top: 10, height: 100 },
        ]
      );

      await fit(manager);

      expect(manager.update).not.toHaveBeenCalled();
    });

    it('should fit each layout type against children of that type only', async () => {
      const manager = makeManager(
        ['card'],
        [
          { id: 'c-desktop', componentId: CONTAINER_ID, type: 'desktop', top: 0, height: 400 },
          { id: 'c-mobile', componentId: CONTAINER_ID, type: 'mobile', top: 0, height: 100 },
          { id: 'card-desktop', componentId: 'card', type: 'desktop', top: 0, height: 200 },
          { id: 'card-mobile', componentId: 'card', type: 'mobile', top: 50, height: 200 },
        ]
      );

      await fit(manager);

      expect(manager.update).toHaveBeenCalledTimes(1);
      expect(manager.update).toHaveBeenCalledWith(Layout, { id: 'c-mobile' }, { height: 260 });
    });

    it('should leave an empty container alone', async () => {
      const manager = makeManager([], [{ id: 'c-desktop', componentId: CONTAINER_ID, type: 'desktop', top: 0, height: 50 }]);

      await fit(manager);

      expect(manager.update).not.toHaveBeenCalled();
    });
  });
});

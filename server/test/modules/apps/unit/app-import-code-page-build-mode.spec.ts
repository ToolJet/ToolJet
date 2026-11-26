/** @group platform */
import { BadRequestException } from '@nestjs/common';
import { AppImportExportService } from '@modules/apps/services/app-import-export.service';
import { App } from 'src/entities/app.entity';
import { EntityManager } from 'typeorm';

const APP_ID = 'app-1';

type Root = { id: string; type: string; properties: string | null };

/** The imported app as the method's three reads see it: its build mode, its root pack components, any other component. */
const managerWith = ({
  buildMode = 'visual',
  roots = [],
  others = false,
}: {
  buildMode?: string;
  roots?: Root[];
  others?: boolean;
}) => ({
  query: jest.fn(async (sql: string) => {
    if (sql.includes('SELECT build_mode')) return [{ build_mode: buildMode }];
    if (sql.includes('EXISTS')) return [{ others }];
    return roots;
  }),
  update: jest.fn(),
});

// The method reads nothing from the service itself, so it runs on the prototype.
const settleImportedBuildMode = (manager: ReturnType<typeof managerWith>) =>
  (
    AppImportExportService.prototype as unknown as {
      settleImportedBuildMode: (m: EntityManager, appId: string) => Promise<void>;
    }
  ).settleImportedBuildMode(manager as unknown as EntityManager, APP_ID);

const codePage = (flag: unknown = '{{true}}', id = 'c-1'): Root => ({
  id,
  type: 'LibraryComponent',
  properties: JSON.stringify({ codePage: { value: flag } }),
});

describe('AppImportExportService', () => {
  describe('settleImportedBuildMode | an imported app with a code page', () => {
    it.each([true, 'true', '{{true}}'])('should switch the app to Code mode for codePage %p', async (flag) => {
      const manager = managerWith({ roots: [codePage(flag)] });
      await settleImportedBuildMode(manager);
      expect(manager.update).toHaveBeenCalledWith(App, { id: APP_ID }, { buildMode: 'code' });
    });

    it('should read a component that holds a NUL in unrelated code', async () => {
      const properties = JSON.stringify({ code: { value: 'a\u0000b' }, codePage: { value: '{{true}}' } });
      const manager = managerWith({ roots: [{ id: 'c-1', type: 'PackComponent', properties }] });
      await settleImportedBuildMode(manager);
      expect(manager.update).toHaveBeenCalled();
    });

    it('should keep a Code mode app that holds only its code pages as it is', async () => {
      const manager = managerWith({ buildMode: 'code', roots: [codePage(), codePage('{{true}}', 'c-2')] });
      await settleImportedBuildMode(manager);
      expect(manager.update).not.toHaveBeenCalled();
    });

    it('should refuse a file that mixes a code page with visual components', async () => {
      const manager = managerWith({ roots: [codePage()], others: true });
      await expect(settleImportedBuildMode(manager)).rejects.toThrow(BadRequestException);
      expect(manager.update).not.toHaveBeenCalled();
    });

    it('should refuse a Code mode file with a library component that is not a code page', async () => {
      const manager = managerWith({ buildMode: 'code', roots: [codePage(), codePage('{{false}}', 'c-2')] });
      await expect(settleImportedBuildMode(manager)).rejects.toThrow(/mixes code with visual components/);
    });

    it('should refuse a Code mode file with visual components and no code page', async () => {
      const manager = managerWith({ buildMode: 'code', others: true });
      await expect(settleImportedBuildMode(manager)).rejects.toThrow(BadRequestException);
    });
  });

  describe('settleImportedBuildMode | a visual app', () => {
    it('should leave an app without a code page as it is, whatever else it holds', async () => {
      const manager = managerWith({
        roots: [
          codePage('{{false}}'),
          { id: 'c-2', type: 'PackComponent', properties: null },
          { id: 'c-3', type: 'LibraryComponent', properties: 'not json' },
        ],
        others: true,
      });
      await settleImportedBuildMode(manager);
      expect(manager.update).not.toHaveBeenCalled();
      expect(manager.query).not.toHaveBeenCalledWith(expect.stringContaining('EXISTS'), expect.anything());
    });
  });
});

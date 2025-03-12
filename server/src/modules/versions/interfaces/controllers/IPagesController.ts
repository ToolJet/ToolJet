import { CreatePageDto, DeletePageDto, ReorderPagesDto, UpdatePageDto } from '@modules/apps/dto/page';
import { App as AppEntity } from '@entities/app.entity';

export interface IPagesController {
  createPages(app: AppEntity, createPageDto: CreatePageDto): Promise<void>;

  clonePage(app: AppEntity, pageId: string): Promise<any>;

  updatePages(app: AppEntity, updatePageDto: UpdatePageDto): Promise<void>;

  reorderPages(app: AppEntity, reorderPagesDto: ReorderPagesDto): Promise<void>;

  deletePage(app: AppEntity, deletePageDto: DeletePageDto): Promise<void>;
}

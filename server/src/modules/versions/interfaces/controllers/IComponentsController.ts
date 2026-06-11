import { App as AppEntity } from '@entities/app.entity';
import {
  CreateComponentDto,
  DeleteComponentDto,
  LayoutUpdateDto,
  UpdateComponentDto,
} from '@modules/apps/dto/component';
export interface IComponentsController {
  createComponent(app: AppEntity, createComponentDto: CreateComponentDto): Promise<void>;

  updateComponent(app: AppEntity, updateComponentDto: UpdateComponentDto): Promise<void>;

  deleteComponents(app: AppEntity, deleteComponentDto: DeleteComponentDto): Promise<void>;

  updateComponentLayout(app: AppEntity, updateComponentLayout: LayoutUpdateDto): Promise<void>;
}

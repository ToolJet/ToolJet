import { CustomStylesCreateDto } from '../dto/custom_styles.dto';
export interface ICustomStylesController {
  get(user: { organizationId: string }): Promise<any>;
  getCustomStylesforApp(user: { organizationId: string }): Promise<any>;
  getStylesFromApp(app: { organizationId: string }): Promise<any>;
  create(user: { organizationId: string }, orgStylesDto: CustomStylesCreateDto): Promise<void>;
}

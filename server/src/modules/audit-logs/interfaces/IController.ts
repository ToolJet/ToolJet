import { User as UserEntity } from 'src/entities/user.entity'; // Adjust this path to your actual User entity path

export interface IAuditLogsController {
  index(user: UserEntity, query: any): Promise<object>;
}

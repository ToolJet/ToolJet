export interface IAppPermissionsService {
  fetchUsers(appId: string): Promise<any>;
}

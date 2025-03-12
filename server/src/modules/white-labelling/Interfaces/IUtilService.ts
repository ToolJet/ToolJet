export interface IWhiteLabellingUtilService {
  getProcessedSettings(organizationId: string, key?: string): Promise<any>;
}

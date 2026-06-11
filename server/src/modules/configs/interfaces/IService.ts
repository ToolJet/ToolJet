export interface IConfigService {
  public_config(): Promise<Record<string, any>>;
}

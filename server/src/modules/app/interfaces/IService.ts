export interface HealthResponse {
  works: string;
  license: {
    valid: boolean;
    expired: boolean;
  };
}

export interface IAppService {
  getHealth(): Promise<HealthResponse>;
}

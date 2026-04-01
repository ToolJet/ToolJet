export interface HealthResponse {
  works: string;
  license: {
    isLicenseValid: boolean;
    isExpired: boolean;
  };
}

export interface IAppService {
  getHealth(): Promise<HealthResponse>;
}

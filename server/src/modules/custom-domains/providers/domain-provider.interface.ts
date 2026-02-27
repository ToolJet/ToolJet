export interface DomainProviderResult {
  hostnameId: string;
  status: string;
  sslStatus: string;
  cnameTarget: string;
  verificationErrors?: any;
}

export interface IDomainProvider {
  createCustomHostname(domain: string): Promise<DomainProviderResult>;
  deleteCustomHostname(hostnameId: string): Promise<void>;
  getHostnameStatus(hostnameId: string): Promise<DomainProviderResult | null>;
  verifyDomain(domain: string): Promise<{ valid: boolean; errors?: string[] }>;
}

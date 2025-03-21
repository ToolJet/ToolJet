export interface IExternalApiUtilService {
  // generates random password by taking length as the input
  generateRandomPassword(length?: number): string;
}

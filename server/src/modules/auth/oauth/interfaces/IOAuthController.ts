import { Response, Request } from 'express';
import { User } from 'src/entities/user.entity';

export interface IOAuthController {
  signIn(req: Request, configId: string, body: any, user: User, response: Response): Promise<any>;

  getOpenIDRedirect(response: Response, configId: string): Promise<any>;

  getSAMLRedirect(configId: string): Promise<any>;

  commonSignIn(req: Request, ssoType: string, body: any, user: User, response: Response): Promise<any>;

  samlResponse(req: Request, configId: string, res: Response): Promise<any>;
}

import {
  ArgumentsHost,
  Body,
  Catch,
  Controller,
  ExceptionFilter,
  Get,
  HttpException,
  Options,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseFilters,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { SkipThrottle, Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { McpOAuthService } from './service';
import { OAuthFailure } from './protocol';
import { User } from '@entities/user.entity';
import { BootstrapInput, ConsentInput, ViewerInput } from './dto';

@Catch()
export class McpOAuthExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const status =
      error instanceof OAuthFailure ? error.status : error instanceof HttpException ? error.getStatus() : 500;
    res.setHeader('Cache-Control', 'no-store');
    const req = host.switchToHttp().getRequest<Request>();
    if (error instanceof OAuthFailure && error.error === 'invalid_client' &&
        req.headers.authorization && !/\/exchange\/?$/i.test(req.path)) {
      res.setHeader('WWW-Authenticate', 'Basic realm="ToolJet MCP OAuth"');
    }
    res.status(status).json({
      error:
        error instanceof OAuthFailure
          ? error.error
          : status === 401
            ? 'invalid_token'
            : status === 404
              ? 'not_found'
              : 'server_error',
      error_description:
        error instanceof OAuthFailure
          ? error.message
          : status === 500
            ? 'OAuth request failed'
            : 'Request denied',
    });
  }
}

@Controller('mcp-oauth')
@UseFilters(McpOAuthExceptionFilter)
@UseGuards(ThrottlerGuard)
export class McpOAuthController {
  constructor(private readonly oauth: McpOAuthService) {}

  private headers(res: Response) {
    res.set({ 'Cache-Control': 'no-store', Pragma: 'no-cache', 'Referrer-Policy': 'no-referrer' });
  }
  private csrf(req: Request, id: string) {
    const cookie = req.cookies?.[this.oauth.cookieName(id)];
    if (
      req.method !== 'GET' &&
      (typeof req.headers.origin !== 'string' ||
        req.headers['x-tooljet-oauth-csrf'] !== cookie)
    ) {
      throw new OAuthFailure('access_denied', 'Invalid browser authorization request', 403);
    }
    return cookie;
  }
  private origin(req: Request): string {
    const origin = req.headers.origin || req.headers['x-tooljet-oauth-origin'];
    return typeof origin === 'string' ? origin : new URL(this.oauth.settings().browser).origin;
  }
  private async browserMutation(req: Request) {
    if (
      typeof req.headers.origin !== 'string' ||
      req.headers['x-tooljet-oauth'] !== '1'
    ) {
      throw new OAuthFailure('access_denied', 'Invalid browser request', 403);
    }
    await this.oauth.assertBrowserOrigin((req.user as User).organizationId, req.headers.origin);
  }
  @Post('interactions/:id/bootstrap')
  async bootstrap(@Param('id') id: string, @Body() body: BootstrapInput, @Req() req: Request, @Res() res: Response) {
    this.headers(res);
    if (typeof req.headers.origin !== 'string') throw new OAuthFailure('access_denied', 'Missing browser origin', 403);
    const csrf = await this.oauth.bootstrapBrowser(id, body.ticket, body.nonce, req.headers.origin);
    res.cookie(this.oauth.cookieName(id), csrf, {
      httpOnly: true, secure: req.headers.origin.startsWith('https:'), sameSite: 'lax',
      path: new URL(this.oauth.settings().issuer).pathname, maxAge: 600000,
    });
    res.status(204).end();
  }
  @Get('authorize')
  async authorize(@Query() query: Record<string, unknown>, @Res() res: Response) {
    this.headers(res);
    const flow = await this.oauth.start(query);
    res.cookie(this.oauth.cookieName(flow.id), flow.csrf, {
      httpOnly: true,
      secure: this.oauth.settings().issuer.startsWith('https:'),
      sameSite: 'lax',
      path: new URL(this.oauth.settings().issuer).pathname,
      maxAge: 600000,
    });
    res.redirect(flow.location);
  }
  @Get('interactions/:id')
  async interaction(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    this.headers(res);
    res.json(await this.oauth.preview(id, this.csrf(req, id), this.origin(req)));
  }
  @Get('interactions/:id/session')
  @UseGuards(JwtAuthGuard)
  async session(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    this.headers(res);
    const flow = await this.oauth.interaction(id, this.csrf(req, id), undefined, this.origin(req));
    await this.oauth.assertCurrentAuthentication(req.user as User, flow.payload.organizationId);
    res.json({ email: (req.user as User).email });
  }
  @Post('interactions/:id')
  @UseGuards(JwtAuthGuard)
  async consent(@Param('id') id: string, @Body() body: ConsentInput, @Req() req: Request, @Res() res: Response) {
    this.headers(res);
    if (typeof body.allow !== 'boolean') throw new OAuthFailure('invalid_request', 'Choose Allow or Cancel');
    const result = await this.oauth.consent(id, this.csrf(req, id), req.user as User, body.allow, this.origin(req));
    res.clearCookie(this.oauth.cookieName(id), { path: new URL(this.oauth.settings().issuer).pathname });
    res.status(200).json(result);
  }
  @Post('register')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async register(@Body() body: Record<string, unknown>, @Res() res: Response) {
    this.headers(res);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(201).json(await this.oauth.register(body));
  }
  @Post('token')
  async token(@Body() body: Record<string, unknown>, @Req() req: Request, @Res() res: Response) {
    this.headers(res);
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (!req.is('application/x-www-form-urlencoded'))
      throw new OAuthFailure('invalid_request', 'Use form encoding');
    res.status(200).json(await this.oauth.token(body, req.headers.authorization));
  }
  @Post('revoke')
  async revoke(@Body() body: Record<string, unknown>, @Req() req: Request, @Res() res: Response) {
    this.headers(res);
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (!req.is('application/x-www-form-urlencoded'))
      throw new OAuthFailure('invalid_request', 'Use form encoding');
    await this.oauth.revoke(body, req.headers.authorization);
    res.status(200).end();
  }
  @Post('exchange')
  @SkipThrottle()
  async exchange(@Body() body: Record<string, unknown>, @Req() req: Request, @Res() res: Response) {
    this.headers(res);
    res.status(200).json(await this.oauth.exchange(body, req.headers.authorization));
  }
  @Post('viewer')
  @UseGuards(JwtAuthGuard)
  @SetMetadata('mcpOAuthViewerMint', true)
  async viewer(@Body() body: ViewerInput, @Req() req: Request, @Res() res: Response) {
    this.headers(res);
    res.json(await this.oauth.viewer(req.headers['x-tooljet-delegation'] as string,
      req.headers['tj-workspace-id'] as string, body.app_id));
  }
  @Get('connections')
  @UseGuards(JwtAuthGuard)
  async connections(@Req() req: Request, @Res() res: Response) {
    this.headers(res);
    res.json(await this.oauth.connections(req.user as User));
  }
  @Post('connections/:id/revoke')
  @UseGuards(JwtAuthGuard)
  async disconnect(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    this.headers(res);
    await this.browserMutation(req);
    await this.oauth.disconnect(req.user as User, id);
    res.status(204).end();
  }
  @Options(['register', 'token', 'revoke'])
  preflight(@Res() res: Response) {
    this.oauth.assertEnabled();
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.status(204).end();
  }
}

@Controller('.well-known')
@UseFilters(McpOAuthExceptionFilter)
export class McpOAuthMetadataController {
  constructor(private readonly oauth: McpOAuthService) {}
  @Get('oauth-authorization-server/{*path}')
  metadata(@Req() req: Request, @Res() res: Response) {
    const metadata = this.oauth.metadata();
    if (req.path !== `/.well-known/oauth-authorization-server${new URL(metadata.issuer).pathname}`) {
      throw new OAuthFailure('not_found', 'Unknown issuer', 404);
    }
    res.set({ 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300' }).json(metadata);
  }
}

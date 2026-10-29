import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { BuiltinPack, builtinPacksDir, loadBuiltinPacks, readBuiltinPackFile } from './builtin-packs';

const CONTENT_TYPES: Record<string, string> = {
  'index.js': 'application/javascript',
  'index.css': 'text/css',
  'manifest.json': 'application/json',
};

// Built-in component packs, in every edition and for every viewer: no login and no licence, because a released or
// public app loads them like native widgets. Only the packaged first-party files are served.
@Controller('builtin-packs')
export class BuiltinPacksController {
  private packs: BuiltinPack[] | undefined;

  // Read once per process: the folder only changes with a new release.
  private get loaded(): BuiltinPack[] {
    this.packs ??= loadBuiltinPacks(builtinPacksDir());
    return this.packs;
  }

  @Get()
  list(): BuiltinPack[] {
    return this.loaded;
  }

  @Get(':pack/:hash/:file')
  serveFile(
    @Param('pack') pack: string,
    @Param('hash') hash: string,
    @Param('file') file: string,
    @Res() res: Response
  ): void {
    const data = readBuiltinPackFile(builtinPacksDir(), this.loaded, pack, hash, file);
    if (!data) throw new NotFoundException();
    // The hash is part of the URL, so the content behind it never changes.
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.type(CONTENT_TYPES[file]).send(data);
  }
}

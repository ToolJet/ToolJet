import { Controller, Get, Param, Res, NotFoundException, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

// POC: serve externally-built custom-component bundles through the BACKEND (replaces the webpack /poc-dist
// static dir). Public on purpose — GuardValidator will list it as unprotected, which is correct for an asset.
// THE SWAPPABLE SEAM: today it reads a file from the author's dist dir; the real feature reads the bundle
// from object storage / DB, scoped to org + app version, behind auth. Only this handler changes.
const DIST_DIR =
  process.env.CUSTOM_COMPONENTS_DIST_DIR ||
  path.resolve(process.cwd(), '../../custom-component-poc/components/dist'); // server cwd = ToolJet/server

@Controller('custom-components')
export class PocComponentsController {
  @Get(':file')
  serve(@Param('file') file: string, @Res() res: Response) {
    // Only a bare "<name>.js" or "manifest.json" — no slashes, no traversal.
    if (file.includes('..') || !/^[\w-]+\.(js|json)$/.test(file)) throw new BadRequestException('bad component name');
    const full = path.join(DIST_DIR, file);
    if (!fs.existsSync(full)) throw new NotFoundException(`${file} not found in ${DIST_DIR}`);
    res.type(path.extname(full)).send(fs.readFileSync(full)); // .js -> application/javascript, .json -> application/json
  }
}

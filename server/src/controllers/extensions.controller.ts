import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  ClassSerializerInterceptor,
  UploadedFiles,
} from '@nestjs/common';
import { Express } from 'express';
import { ExtensionsService } from '../services/extensions.service';
import { CreateExtensionDto } from '../dto/create-extension.dto';
import { UpdateExtensionDto } from '../dto/update-extension.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Connection } from 'typeorm';
import { decode } from 'js-base64';

@Controller('extensions')
@UseInterceptors(ClassSerializerInterceptor)
export class ExtensionsController {
  constructor(private readonly extensionsService: ExtensionsService, private connection: Connection) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'operations', maxCount: 1 },
      { name: 'icon', maxCount: 1 },
      { name: 'manifest', maxCount: 1 },
    ])
  )
  create(
    @Body() createExtensionDto: CreateExtensionDto,
    @UploadedFiles()
    files: { operations: Express.Multer.File[]; icon: Express.Multer.File[]; manifest: Express.Multer.File[] }
  ) {
    return this.extensionsService.create(createExtensionDto, files);
  }

  @Get()
  async findAll() {
    const extensions = await this.extensionsService.findAll();
    return extensions.map((extension) => {
      extension.iconFile.data = `data:image/svg+xml;base64,${extension.iconFile.data.toString('utf8')}`;
      extension.manifestFile.data = JSON.parse(decode(extension.manifestFile.data.toString('utf8')));
      return extension;
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.extensionsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateExtensionDto: UpdateExtensionDto) {
    return this.extensionsService.update(id, updateExtensionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.extensionsService.remove(id);
  }
}

import { Controller, UseGuards, Body, Put, Get, Query, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';
import { SuperAdminGuard } from 'src/modules/auth/super-admin.guard';
import { WhiteLabellingService } from '@services/white_labelling.service';
import { UpdateWhiteLabellingDto } from '@dto/update_white_labelling.dto';
import { LicenseService } from '@services/license.service';
import { LICENSE_FIELD } from 'src/helpers/license.helper';
import { WhiteLabellingGuard } from '@ee/licensing/guards/whiteLabelling.guard';
import {
  WHITE_LABELLING_OPTIONS,
  DEFAULT_WHITE_LABELLING_SETTINGS,
  WHITE_LABELLING_COLUMNS,
} from 'src/helpers/white_labelling.constants';
import { NotFoundException } from '@nestjs/common';
import { Organization } from 'src/entities/organization.entity';
import { EntityManager } from 'typeorm';

@Controller('white-labelling')
export class WhiteLabellingController {
  constructor(
    private readonly whiteLabellingService: WhiteLabellingService,
    private licenseService: LicenseService,
    private readonly entityManager: EntityManager
  ) {}

  @UseGuards()
  @Get('/:organizationId')
  async getSettings(@Param('organizationId') organizationId: string, @Query('key') key?: string) {
    const whiteLabellingEnabled = await this.licenseService.getLicenseTerms(LICENSE_FIELD.WHITE_LABEL, organizationId);
    let setting;

    if (whiteLabellingEnabled) {
      setting = await this.whiteLabellingService.getSettings(organizationId);
    }
    if (key) {
      let settingValue = DEFAULT_WHITE_LABELLING_SETTINGS[key];
      if (whiteLabellingEnabled) {
        settingValue = setting?.[WHITE_LABELLING_COLUMNS[key]];
        if (settingValue === '' || setting.status === 'INACTIVE') {
          settingValue = DEFAULT_WHITE_LABELLING_SETTINGS[key];
        }
      }
      return { [key]: settingValue };
    }
    const formattedSettings = Object.keys(WHITE_LABELLING_OPTIONS).reduce((settings, option) => {
      const columnName = WHITE_LABELLING_COLUMNS[option];
      settings[WHITE_LABELLING_OPTIONS[option]] = whiteLabellingEnabled ? setting?.[columnName] || '' : '';

      return settings;
    }, {});

    return formattedSettings;
  }

  @UseGuards()
  @Get('/by-slug/:workspaceSlug')
  async getSettingsBySlug(@Param('workspaceSlug') workspaceSlug: string, @Query('key') key?: string) {
    // Find the organization by slug
    const organization = await this.entityManager.findOne(Organization, { slug: workspaceSlug });
    if (!organization) {
      throw new NotFoundException(`Organization with slug '${workspaceSlug}' not found.`);
    }
    const organizationId = organization.id;
    const whiteLabellingEnabled = await this.licenseService.getLicenseTerms(LICENSE_FIELD.WHITE_LABEL, organizationId);
    let setting;

    if (whiteLabellingEnabled) {
      setting = await this.whiteLabellingService.getSettings(organizationId);
    }
    if (key) {
      let settingValue = DEFAULT_WHITE_LABELLING_SETTINGS[key];
      if (whiteLabellingEnabled) {
        settingValue = setting?.[WHITE_LABELLING_COLUMNS[key]];
        if (settingValue === '' || setting.status === 'INACTIVE') {
          settingValue = DEFAULT_WHITE_LABELLING_SETTINGS[key];
        }
      }
      return { [key]: settingValue };
    }
    const formattedSettings = Object.keys(WHITE_LABELLING_OPTIONS).reduce((settings, option) => {
      const columnName = WHITE_LABELLING_COLUMNS[option];
      settings[WHITE_LABELLING_OPTIONS[option]] = whiteLabellingEnabled ? setting?.[columnName] || '' : '';

      return settings;
    }, {});

    return formattedSettings;
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard, WhiteLabellingGuard)
  @Put('/:organizationId')
  async updateSettings(
    @Param('organizationId') organizationId: string,
    @Body() updateWhiteLabellingDto: UpdateWhiteLabellingDto
  ) {
    const whiteLabelSettings = {
      logo: updateWhiteLabellingDto.appLogo,
      text: updateWhiteLabellingDto.pageTitle,
      favicon: updateWhiteLabellingDto.favicon,
    };
    const updatedWhiteLabelSettings = this.whiteLabellingService.updateSettings(organizationId, whiteLabelSettings);
    return updatedWhiteLabelSettings;
  }
}

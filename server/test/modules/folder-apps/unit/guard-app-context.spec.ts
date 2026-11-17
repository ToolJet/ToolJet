import { ExecutionContext } from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { App } from '@entities/app.entity';
import { FeatureAbilityGuard } from '@modules/folder-apps/ability/guard';
import { FEATURE_KEY } from '@modules/folder-apps/constants';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { TransactionLogger } from '@modules/logging/service';

/** @group platform */
describe('Folder app permission lookup', () => {
  it('should retain workspace context for loaded apps while rejecting an unavailable target', async () => {
    const find = jest.fn().mockResolvedValue([]);
    const dataSource = {
      manager: { findOne: jest.fn().mockResolvedValue({ id: 'team-folder', createdBy: 'builder' }), find },
    } as unknown as DataSource;
    const guard = new FeatureAbilityGuard(
      { get: () => [FEATURE_KEY.CREATE_FOLDER_APP] } as unknown as Reflector,
      null as unknown as ModuleRef,
      null as unknown as LicenseTermsService,
      null as unknown as TransactionLogger,
      dataSource
    );
    const request = {
      user: { id: 'builder', organizationId: 'team-workspace' },
      body: { folder_id: 'team-folder', app_id: 'unavailable-app' },
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => () => undefined,
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).resolves.toBe(false);
    // AppsSubscriber runs for selected App rows before the permission check continues.
    expect(find).toHaveBeenCalledWith(
      App,
      expect.objectContaining({
        select: expect.arrayContaining(['organizationId']),
        where: expect.objectContaining({ organizationId: 'team-workspace' }),
      })
    );
  });
});

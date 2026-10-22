/**
 * @group database
 */
import { BadRequestException } from '@nestjs/common';

import { TooljetDbController } from '@modules/tooljet-db/controller';

const MB = 1024 * 1024;

describe('TooljetDbController', () => {
  const originalMaxCsvFileSize = process.env.TOOLJET_DB_BULK_UPLOAD_MAX_CSV_FILE_SIZE_MB;
  let bulkUploadService: { perform: jest.Mock };

  function buildController() {
    bulkUploadService = {
      perform: jest.fn().mockResolvedValue({ processedRows: 1 }),
    };

    return new TooljetDbController({} as any, {} as any, bulkUploadService as any, {} as any);
  }

  afterEach(() => {
    if (originalMaxCsvFileSize === undefined) {
      delete process.env.TOOLJET_DB_BULK_UPLOAD_MAX_CSV_FILE_SIZE_MB;
    } else {
      process.env.TOOLJET_DB_BULK_UPLOAD_MAX_CSV_FILE_SIZE_MB = originalMaxCsvFileSize;
    }

    jest.clearAllMocks();
  });

  it('allows CSV uploads up to the default 500 MB limit', async () => {
    delete process.env.TOOLJET_DB_BULK_UPLOAD_MAX_CSV_FILE_SIZE_MB;
    const controller = buildController();

    const result = await controller.bulkUpload('organization-id', 'table-name', {
      size: 500 * MB,
      buffer: Buffer.from('name\nAlice'),
    });

    expect(bulkUploadService.perform).toHaveBeenCalledWith(
      'organization-id',
      'table-name',
      Buffer.from('name\nAlice')
    );
    expect(result).toEqual({ result: { processed_rows: 1 } });
  });

  it('rejects CSV uploads above the default 500 MB limit', async () => {
    delete process.env.TOOLJET_DB_BULK_UPLOAD_MAX_CSV_FILE_SIZE_MB;
    const controller = buildController();

    await expect(
      controller.bulkUpload('organization-id', 'table-name', {
        size: 500 * MB + 1,
        buffer: Buffer.from('name\nAlice'),
      })
    ).rejects.toThrow(BadRequestException);

    expect(bulkUploadService.perform).not.toHaveBeenCalled();
  });

  it('uses TOOLJET_DB_BULK_UPLOAD_MAX_CSV_FILE_SIZE_MB as an override', async () => {
    process.env.TOOLJET_DB_BULK_UPLOAD_MAX_CSV_FILE_SIZE_MB = '1';
    const controller = buildController();

    await expect(
      controller.bulkUpload('organization-id', 'table-name', {
        size: MB + 1,
        buffer: Buffer.from('name\nAlice'),
      })
    ).rejects.toThrow('File size cannot be greater than 1MB');

    expect(bulkUploadService.perform).not.toHaveBeenCalled();
  });
});

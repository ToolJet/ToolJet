import React, { useState, useCallback, useRef } from 'react';
import Drawer from '@/_ui/Drawer';
import { toast } from 'react-hot-toast';
import { useTooljetDatabaseContext } from '../../TooljetDatabaseContext';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/Rocket/Button/Button';
import { InlineInfo } from '@/components/ui/Rocket/InlineInfo/InlineInfo';
import { DrawerShell } from '../TableDrawer/DrawerShell';
import { FileDropzone } from './FileDropzone';

function BulkUploadDrawer({
  isBulkUploadDrawerOpen,
  setIsBulkUploadDrawerOpen,
  bulkUploadFile,
  handleBulkUploadFileChange,
  handleBulkUpload,
  isBulkUploading,
  errors,
}) {
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [progress, setProgress] = useState(0);
  const { columns, selectedTable } = useTooljetDatabaseContext();
  const hiddenFileInput = useRef(null);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (Math.round(file.size / 1024) > 2 * 1024) {
      toast.error('File size cannot exceed more than 2MB');
    } else {
      handleBulkUploadFileChange(file);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTemplateDownload = () => {
    setIsDownloadingTemplate(true);

    return setTimeout(() => {
      // Create a CSV content string with the column names as the header row
      const headerRow = columns.map((col) => col.Header).join(',');
      const csvContent = [headerRow].join('\n');
      // Create a Blob with the CSV content
      const blob = new Blob([csvContent], { type: 'text/csv' });
      // Create a temporary URL for the Blob
      const href = URL.createObjectURL(blob);
      // Create a link element to trigger the download
      const link = document.createElement('a');
      link.href = href;
      link.download = `${selectedTable.table_name}.csv`;
      // Trigger the download
      link.click();

      setIsDownloadingTemplate(false);

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(href);
    }, 500);
  };

  const handleClick = () => {
    hiddenFileInput.current.click();
  };

  const close = () => setIsBulkUploadDrawerOpen(false);

  return (
    <Drawer
      isOpen={isBulkUploadDrawerOpen}
      onClose={close}
      position="right"
      drawerStyle={{ width: '480px' }}
      className="tj-db-drawer"
    >
      <DrawerShell
        title="Bulk upload data"
        data-cy="bulk-upload-data-header"
        onClose={close}
        submitLabel="Upload data"
        submitDataCy="upload-data-button"
        submitDisabled={
          !isBulkUploading &&
          (!bulkUploadFile || errors.client.length > 0 || errors.server.length > 0 || progress <= 99)
        }
        isSubmitting={isBulkUploading}
        onSubmit={handleBulkUpload}
      >
        <InlineInfo
          type="warning"
          variant="filled"
          description={
            <span data-cy="helper-text-bulk-upload">
              Download the template to add your data or format your file in the same as the template. ToolJet won’t be
              able to recognise files in any other format.
            </span>
          }
          action={
            <Button
              variant="outline"
              size="medium"
              leadingVisual={<FileText />}
              loading={isDownloadingTemplate}
              onClick={handleTemplateDownload}
              data-cy="button-download-template"
            >
              Download template
            </Button>
          }
        />
        <FileDropzone
          handleClick={handleClick}
          hiddenFileInput={hiddenFileInput}
          errors={errors}
          handleFileChange={handleBulkUploadFileChange}
          onDrop={onDrop}
          progress={progress}
          setProgress={setProgress}
        />
      </DrawerShell>
    </Drawer>
  );
}
export default BulkUploadDrawer;

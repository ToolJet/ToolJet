import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Rocket';
import { cn } from '@/lib/utils';
import { libraryAppService } from '@/_services';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import GalleryView from './GalleryView';
import TemplateDetailsView, { TemplateBreadcrumb } from './TemplateDetailsView';
import { trackTemplateEvent } from './analytics';

export default function TemplateLibraryModal(props) {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState([]);
  const [categoryTitles, setCategoryTitles] = useState({});
  const [loadStatus, setLoadStatus] = useState('loading'); // 'loading' | 'loaded' | 'error'
  const hasRequested = useRef(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const galleryScrollRef = useRef(null);
  const galleryScrollTop = useRef(0);
  const detailsOpenedAt = useRef(0);

  const { currentBranch, orgGitConfig } = useWorkspaceBranchesStore((state) => ({
    currentBranch: state.currentBranch,
    orgGitConfig: state.orgGitConfig,
  }));
  const isOnDefaultBranch =
    (orgGitConfig?.is_branching_enabled || orgGitConfig?.isBranchingEnabled) &&
    (currentBranch?.is_default || currentBranch?.isDefault);

  const loadTemplates = useCallback(() => {
    setLoadStatus('loading');
    libraryAppService
      .templateManifests()
      .then((data) => {
        setTemplates(data?.template_app_manifests ?? []);
        setCategoryTitles(data?.categories ?? {});
        setLoadStatus('loaded');
      })
      .catch(() => setLoadStatus('error'));
  }, []);

  // The manifest list is large, so it is fetched on first open rather than on every dashboard load
  useEffect(() => {
    if (props.show && !hasRequested.current) {
      hasRequested.current = true;
      loadTemplates();
    }
  }, [props.show, loadTemplates]);

  // Reopening the modal always starts on the grid, whoever closed it
  useEffect(() => {
    if (!props.show) setSelectedTemplate(null);
  }, [props.show]);

  // The gallery stays mounted while details are open; restore its scroll position on the way back
  useLayoutEffect(() => {
    if (!selectedTemplate && galleryScrollRef.current) galleryScrollRef.current.scrollTop = galleryScrollTop.current;
  }, [selectedTemplate]);

  const categoryTitle = (categoryId) => categoryTitles[categoryId] || categoryId;

  const openDetails = (template) => {
    galleryScrollTop.current = galleryScrollRef.current?.scrollTop ?? 0;
    detailsOpenedAt.current = Date.now();
    trackTemplateEvent('click_template_name', {
      template_category_id: template.category,
      template_name: template.name,
    });
    setSelectedTemplate(template);
  };

  const backToGallery = () => {
    trackTemplateEvent('template_details_back', {
      template_name: selectedTemplate?.name,
      seconds_on_details: Math.round((Date.now() - detailsOpenedAt.current) / 1000),
    });
    setSelectedTemplate(null);
  };

  const close = () => {
    setSelectedTemplate(null);
    props.onCloseButtonClick();
  };

  const createFromTemplate = () => {
    if (isOnDefaultBranch) {
      toast.error('Master is locked. Create a branch to create an app from template.', { position: 'top-center' });
      return;
    }
    const template = selectedTemplate;
    trackTemplateEvent('create_application_from_template', {
      template_category_id: template.category,
      template_name: template.name,
      button_name: 'create_application_from_template',
      previous_action_button_name: props.fromButton,
    });
    close();
    props.openCreateAppFromTemplateModal(template);
  };

  return (
    <Dialog open={!!props.show} onOpenChange={(open) => !open && close()}>
      <DialogContent
        size="extraLarge"
        className={cn('tw-h-[85vh] tw-max-w-[1200px]', { 'dark-theme theme-dark': props.darkMode })}
      >
        <DialogHeader>
          {selectedTemplate ? (
            <>
              <DialogTitle className="tw-sr-only">{selectedTemplate.name}</DialogTitle>
              <TemplateBreadcrumb template={selectedTemplate} onBack={backToGallery} />
            </>
          ) : (
            <DialogTitle data-cy="select-template-header">
              {t('homePage.templateLibraryModal.select', 'Select template')}
            </DialogTitle>
          )}
        </DialogHeader>
        <DialogBody noPadding>
          <div className={selectedTemplate ? 'tw-hidden' : 'tw-h-full'}>
            <GalleryView
              ref={galleryScrollRef}
              templates={templates}
              loadStatus={loadStatus}
              onRetry={loadTemplates}
              categoryTitles={categoryTitles}
              onOpen={openDetails}
            />
          </div>
          {selectedTemplate && (
            <TemplateDetailsView
              template={selectedTemplate}
              categoryTitle={categoryTitle(selectedTemplate.category)}
              darkMode={props.darkMode}
              onCreate={createFromTemplate}
              createDisabled={props.appCreationDisabled}
            />
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

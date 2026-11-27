import React, { forwardRef, useCallback, useEffect, useId, useRef, useState } from 'react';
import cx from 'classnames';
import { AlertTriangle, ArrowRight, Copy, Lock, Trash } from 'lucide-react';
import { isLinkedAppValid } from '@/AppBuilder/_stores/utils';
import { Popover } from 'react-bootstrap';
import useStore from '@/AppBuilder/_stores/store';
import { Icon } from '@/AppBuilder/CodeBuilder/Elements/Icon';
import { EventManager } from '../../Inspector/EventManager';
import { PAGE_EVENTS_META } from './pageEventsMeta';
import { kebabCase } from 'lodash';
import Select from '@/_ui/Select';
import ToggleGroup from '@/ToolJetUI/SwitchGroup/ToggleGroup';
import ToggleGroupItem from '@/ToolJetUI/SwitchGroup/ToggleGroupItem';
import { appsService } from '@/_services';
import { ToolTip } from '@/_components';
import { ToolTip as LicenseTooltip } from '@/_components/ToolTip';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import CodeHinter from '@/AppBuilder/CodeEditor';
import FxButton from '@/AppBuilder/CodeBuilder/Elements/FxButton';
import { resolveReferences, validateKebabCase } from '@/_helpers/utils';
import { ToolTip as InspectorTooltip } from '../../Inspector/Elements/Components/ToolTip';
import { shallow } from 'zustand/shallow';
import { Button } from '@/components/ui/Button/Button';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import PanelHeader from '@/AppBuilder/Shared/Panel/PanelHeader';
import PanelIconButton from '@/AppBuilder/Shared/Panel/PanelIconButton';
import PanelDocumentationLink from '@/AppBuilder/Shared/Panel/PanelDocumentationLink';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { getPanelCloseLabel, getPastPanelOffset } from '@/AppBuilder/panelLayout';

const POPOVER_TITLES = {
  add: {
    default: 'New page',
    app: 'New nav item with app',
    url: 'New nav item with URL',
    custom: 'New custom nav item',
    group: 'New nav group',
  },
  edit: {
    default: 'Edit page',
    app: 'Edit nav item',
    url: 'Edit nav item',
    custom: 'Edit nav item',
    group: 'Edit nav group',
  },
};

// Measures the panel's shell, not its content, because the content slides in with a transform.
export const getPagePopupPopperConfig = (target) => ({
  modifiers: [
    {
      name: 'offset',
      options: {
        offset: (rects) =>
          getPastPanelOffset(
            target?.closest('.sidebar-h-100-popover')?.getBoundingClientRect().right,
            window.innerWidth
          )(rects),
      },
    },
  ],
});

const OPEN_APP_MODES = [
  { label: 'New tab', value: 'new_tab' },
  { label: 'Same tab', value: 'same_tab' },
];

export const AddEditPagePopup = forwardRef(
  ({ darkMode, embedded = false, pageGroup, onClose, onNestedPopoverOpenChange, ...props }, ref) => {
    const { moduleId } = useModuleContext();
    const popupConfig = useStore((state) => state.newPagePopupConfig);
    const selectedPage = useStore((state) => state.editingPage);
    const editingPage = pageGroup ?? selectedPage;
    const { show, mode, type } = pageGroup ? { show: true, mode: 'edit', type: 'group' } : popupConfig;
    const pages = useStore((state) => state?.modules?.canvas?.pages ?? []);
    const addNewPage = useStore((state) => state.addNewPage);
    const updatePageName = useStore((state) => state.updatePageName);
    const updatePageHandle = useStore((state) => state.updatePageHandle);
    const updatePageTarget = useStore((state) => state.updatePageTarget);
    const updatePageURL = useStore((state) => state.updatePageURL);
    const updatePageIcon = useStore((state) => state.updatePageIcon);
    const markAsHomePage = useStore((state) => state.markAsHomePage);
    const clonePage = useStore((state) => state.clonePage);
    const cloneGroup = useStore((state) => state.cloneGroup);
    const toggleDeleteConfirmationModal = useStore((state) => state.toggleDeleteConfirmationModal);
    const switchPage = useStore((state) => state.switchPage);

    const isPageGroup = useStore((state) => state.isPageGroup);
    const homePageId = useStore((state) => state.appStore.modules[moduleId].app.homePageId);
    const updatePageVisibility = useStore((state) => state.updatePageVisibility);
    const disableOrEnablePage = useStore((state) => state.disableOrEnablePage);
    const togglePageHeader = useStore((state) => state.togglePageHeader);
    const togglePageFooter = useStore((state) => state.togglePageFooter);
    const updatePageTargetApp = useStore((state) => state.updatePageTargetApp);
    const currentPageId = useStore((state) => state.modules[moduleId].currentPageId);
    const setCurrentPageHandle = useStore((state) => state.setCurrentPageHandle);
    const appId = useStore((state) => state.appStore.modules[moduleId].app.appId);

    const [page, setPage] = useState(editingPage || props?.page);
    // Compare input edits with the saved page, including changes made by another control.
    const savedPage = pages.find((p) => p.id === page?.id) ?? page;

    const showPageHeaderOnDesktop = useStore(
      (state) => state.modules[moduleId].pages.find((p) => p.id === page?.id)?.pageHeader?.showOnDesktop,
      shallow
    );

    const showPageHeaderOnMobile = useStore(
      (state) => state.modules[moduleId].pages.find((p) => p.id === page?.id)?.pageHeader?.showOnMobile,
      shallow
    );

    const showPageFooterOnDesktop = useStore(
      (state) => state.modules[moduleId].pages.find((p) => p.id === page?.id)?.pageFooter?.showOnDesktop,
      shallow
    );

    const showPageFooterOnMobile = useStore(
      (state) => state.modules[moduleId].pages.find((p) => p.id === page?.id)?.pageFooter?.showOnMobile,
      shallow
    );
    const hasCanvasPageHeaderEnabled = useStore((state) => state.license?.featureAccess?.canvasPageHeaderEnabled);

    const hasCanvasPageFooterEnabled = useStore((state) => state.license?.featureAccess?.canvasPageFooterEnabled);
    const hasAppPermissionPages = useStore((state) => state.license?.featureAccess?.appPermissionPages);
    const togglePagePermissionModal = useStore((state) => state.togglePagePermissionModal);
    const [pageName, setPageName] = useState('');
    const [handle, setHandle] = useState('');
    const [pageURL, setPageURL] = useState('');
    // Re-entrancy guard for the auto-create effects below. MUST be a ref, not state:
    // addNewPage() pushes the new page into the zustand store synchronously, which
    // forces a nested synchronous re-render + effect flush (useSyncExternalStore)
    // BEFORE any setState queued after the call is applied. A state flag therefore
    // never flips in time and the effect re-enters itself until React throws
    // "Maximum update depth exceeded" — one click created 50+ pages. The ref is
    // written before addNewPage() so the nested flush sees it already set.
    // The right panel keeps this popup mounted between clicks, so each New page click re-arms the guard below.
    const hasAutoSavedRef = useRef(false);
    const [error, setError] = useState(null);

    const isHomePage = page?.id === homePageId;
    const deleteDisabledReasonId = useId();

    //Nav item with app
    const [appOptions, setAppOptions] = useState([]);
    const [appOptionsLoading, setAppOptionsLoading] = useState(true);

    const linkedAppsMap = useStore((state) => state.appStore.modules[moduleId]?.linkedApps);
    const { isValid: isLinkValid, errorMessage: linkedAppErrorMessage } = isLinkedAppValid(
      page?.targetCorelationId,
      linkedAppsMap
    );
    const isInvalid = type === 'app' && !isLinkValid;
    const isTargetMissing =
      page?.targetCorelationId && !appOptions.some((opt) => opt.value === page?.targetCorelationId);

    useEffect(() => {
      setError(null);
    }, [show]);

    // Every New page click writes a fresh popupConfig object. Declared before the create effects so the guard is
    // re-armed before they run in the same commit.
    useEffect(() => {
      if (mode === 'add') hasAutoSavedRef.current = false;
    }, [popupConfig, mode]);

    useEffect(() => {
      if (mode === 'add' && type === 'default' && !hasAutoSavedRef.current) {
        hasAutoSavedRef.current = true;
        const existingNames = pages.map((p) => p.name.toLowerCase());
        let index = 1;
        let newName = `Page ${index}`;
        while (existingNames.includes(newName.toLowerCase())) {
          index++;
          newName = `Page ${index}`;
        }
        const pageObj = { type: 'default' };
        addNewPage(newName, kebabCase(newName.toLowerCase()), isPageGroup, pageObj).then((data) => {
          setPage(data);
          setPageName(newName);
          setHandle(data?.handle);
        });
      } else if (editingPage) {
        setPage(editingPage);
        setPageName(editingPage.name);
        setHandle(editingPage.handle);
      }
    }, [mode, pages, editingPage, addNewPage, isPageGroup, type, popupConfig]);

    //Nav item with URL hooks
    useEffect(() => {
      if (mode === 'add' && type === 'url' && !hasAutoSavedRef.current) {
        hasAutoSavedRef.current = true;
        const existingNames = pages.map((p) => p.name.toLowerCase());
        let index = 1;
        let newName = `URL ${index}`;
        while (existingNames.includes(newName.toLowerCase())) {
          index++;
          newName = `URL ${index}`;
        }
        const pageObj = { type: 'url', openIn: 'new_tab', url: 'https://www.tooljet.com' };
        addNewPage(newName, kebabCase(newName.toLowerCase()), isPageGroup, pageObj).then((data) => {
          setPage(data);
          setPageName(newName);
          setPageURL(data?.url);
        });
      } else if (editingPage) {
        setPage(editingPage);
        setPageName(editingPage.name);
        setPageURL(editingPage.url);
      }
    }, [addNewPage, appOptions, editingPage, isPageGroup, mode, pages, type, popupConfig]);

    //Nav item with app hooks
    useEffect(() => {
      const fetchApps = async () => {
        const { apps } = await appsService.getAllAddableApps();
        return apps;
      };

      // eslint-disable-next-line no-inner-declarations
      async function getAllApps() {
        const apps = await fetchApps(0);
        let appsOptionsList = [];
        apps
          .filter((item) => item.slug !== undefined && item.id !== appId)
          .forEach((item) => {
            appsOptionsList.push({
              label: item.name,
              value: item.co_relation_id,
              slug: item.slug,
              currentVersionId: item.current_version_id,
            });
          });
        return appsOptionsList;
      }

      getAllApps()
        .then((apps) => {
          setAppOptions(apps);
        })
        .finally(() => {
          setAppOptionsLoading(false);
        });
      if (mode === 'add' && type === 'app' && !hasAutoSavedRef.current) {
        hasAutoSavedRef.current = true;
        const existingNames = pages.map((p) => p.name.toLowerCase());
        let index = 1;
        let newName = `App ${index}`;
        while (existingNames.includes(newName.toLowerCase())) {
          index++;
          newName = `App ${index}`;
        }
        const pageObj = { type: 'app', openIn: 'new_tab' };
        addNewPage(newName, kebabCase(newName.toLowerCase()), isPageGroup, pageObj).then((data) => {
          setPage(data);
          setPageName(newName);
        });
      } else if (editingPage) {
        setPage(editingPage);
        setPageName(editingPage.name);
      }
    }, [mode, pages, editingPage, addNewPage, isPageGroup, type, appId, popupConfig]);

    //Custom nav item
    useEffect(() => {
      if (mode === 'add' && type === 'custom' && !hasAutoSavedRef.current) {
        hasAutoSavedRef.current = true;
        const existingNames = pages.map((p) => p.name.toLowerCase());
        let index = 1;
        let newName = `Custom ${index}`;
        while (existingNames.includes(newName.toLowerCase())) {
          index++;
          newName = `Custom ${index}`;
        }
        const pageObj = { type: 'custom' };
        addNewPage(newName, kebabCase(newName.toLowerCase()), isPageGroup, pageObj).then((data) => {
          setPage(data);
          setPageName(newName);
        });
      } else if (editingPage) {
        setPage(editingPage);
        setPageName(editingPage.name);
      }
    }, [mode, pages, editingPage, addNewPage, isPageGroup, type, popupConfig]);

    //Nav item with group
    useEffect(() => {
      if (mode === 'add' && type === 'group' && !hasAutoSavedRef.current) {
        hasAutoSavedRef.current = true;
        const existingNames = pages.map((p) => p.name.toLowerCase());
        let index = 1;
        let newName = `Group ${index}`;
        while (existingNames.includes(newName.toLowerCase())) {
          index++;
          newName = `Group ${index}`;
        }
        const pageObj = { type: 'group', openIn: 'new_tab' };
        addNewPage(newName, kebabCase(newName.toLowerCase()), true, pageObj).then((data) => {
          setPage(data);
          setPageName(newName);
        });
      } else if (editingPage) {
        setPage(editingPage);
        setPageName(editingPage.name);
      }
    }, [mode, pages, editingPage, addNewPage, isPageGroup, type, appId, popupConfig]);

    const handlePageSwitch = useCallback(() => {
      if (currentPageId === page.id) {
        return;
      }
      switchPage(page.id, page.handle);
      setCurrentPageHandle(page.handle);
    }, [currentPageId, page?.id, page?.handle, switchPage, setCurrentPageHandle]);

    const onChangePageHandleValue = (event) => {
      setError(null);
      const newHandle = event.target.value;

      if (newHandle === '') setError('Page handle cannot be empty');
      if (newHandle === handle) setError('Page handle cannot be same as the existing page handle');
      const isValidKebabCase = validateKebabCase(newHandle);
      if (!isValidKebabCase.isValid) {
        setError(isValidKebabCase.error);
      }
      setHandle(newHandle);
    };

    const handleSave = () => {
      if (handle === savedPage?.handle) {
        setError(null);
        return;
      }
      const { isValid, error } = validateKebabCase(handle);
      if (!isValid) {
        setError(error);
        return;
      }
      const transformedPageHandle = kebabCase(handle);
      updatePageHandle(page.id, transformedPageHandle);
      setError(null);
    };

    const entity = type === 'group' ? 'group' : 'page';
    const deleteDisabledReason = isHomePage ? "Home page can't be deleted" : undefined;
    const permissionDisabledReason = !hasAppPermissionPages
      ? "You don't have access to page permissions. Upgrade your plan to access this feature."
      : undefined;
    const actions = [
      ...(!['group', 'custom'].includes(type)
        ? [{ label: 'Go to page', icon: 'arrowright01', menuIcon: ArrowRight, onSelect: handlePageSwitch }]
        : []),
      {
        label: `Duplicate ${entity}`,
        icon: 'duplicatepage',
        menuIcon: Copy,
        onSelect: () => (type === 'group' ? cloneGroup(page?.id) : clonePage(page?.id)),
      },
      ...(type !== 'group'
        ? [
            {
              label: 'Page permission',
              icon: 'lock',
              menuIcon: Lock,
              dataCy: 'page-permission-button',
              enterprise: !hasAppPermissionPages,
              disabledReason: permissionDisabledReason,
              onSelect: () => {
                if (hasAppPermissionPages && page) togglePagePermissionModal(true, page);
              },
            },
          ]
        : []),
      {
        label: `Delete ${entity}`,
        icon: 'delete01',
        menuIcon: Trash,
        dataCy: 'delete-page-button',
        destructive: true,
        onSelect: () => {
          if (!isHomePage && page) toggleDeleteConfirmationModal(true, page);
        },
        disabledReason: deleteDisabledReason,
      },
    ];
    const title = POPOVER_TITLES?.[mode]?.[type];

    return (
      <Popover
        id="add-new-page-popup"
        ref={ref}
        {...props}
        className={`add-new-page-popup ${embedded ? 'add-new-page-popup--embedded' : ''} ${darkMode && 'dark-theme theme-dark'}`}
      >
        {embedded ? (
          <PanelHeader
            title={title}
            onClose={onClose}
            closeLabel={getPanelCloseLabel('page')}
            closeDataCy="close-page-configuration-button"
          >
            <PanelDocumentationLink
              href="https://docs.tooljet.com/docs/app-builder/left-sidebar/pages/"
              label="Read pages documentation"
              dataCy="page-documentation-link"
            />
            <DropdownMenu.Root modal={false}>
              <DropdownMenu.Trigger asChild>
                <PanelIconButton
                  label="Page options"
                  leadingIcon="ellipsis-vertical"
                  size="medium"
                  isLucid
                  data-cy="page-options-button"
                />
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={8}
                  className={cx('popover page-header-options', { 'dark-theme': darkMode })}
                >
                  <div className="list-item-popover-body">
                    {actions.map(
                      ({ label, menuIcon: MenuIcon, dataCy, destructive, enterprise, onSelect, disabledReason }) => (
                        <ToolTip
                          key={label}
                          message={disabledReason ?? label}
                          placement="left"
                          show={Boolean(disabledReason)}
                        >
                          <DropdownMenu.Item
                            className="list-item-popover-option"
                            data-cy={dataCy}
                            disabled={Boolean(disabledReason)}
                            aria-label={label}
                            aria-describedby={disabledReason && destructive ? deleteDisabledReasonId : undefined}
                            onSelect={onSelect}
                          >
                            <span className="list-item-popover-menu-option-icon">
                              <MenuIcon
                                size={16}
                                color={
                                  disabledReason
                                    ? 'var(--icon-disabled)'
                                    : destructive
                                      ? 'var(--icon-danger)'
                                      : 'var(--icon-weak)'
                                }
                              />
                            </span>
                            <span
                              className={cx('list-item-option-menu-label', {
                                'tw-text-editor-text-danger': destructive && !disabledReason,
                                'color-disabled': disabledReason,
                              })}
                            >
                              {label}
                            </span>
                            {enterprise && <SolidIcon width={16} name="enterprisecrown" className="mx-1" />}
                            {disabledReason && destructive && (
                              <span id={deleteDisabledReasonId} className="visually-hidden">
                                {disabledReason}
                              </span>
                            )}
                          </DropdownMenu.Item>
                        </ToolTip>
                      )
                    )}
                  </div>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </PanelHeader>
        ) : (
          <Popover.Header>
            <div className="d-flex justify-content-between align-items-center">
              <div className="tj-text-xsm font-weight-500 text-default">{title}</div>
              <div className="actions-container">
                {actions.map(({ label, icon, dataCy, onSelect, disabledReason }) => (
                  <ToolTip key={icon} message={disabledReason ?? label} placement="bottom">
                    <Button
                      data-cy={dataCy}
                      fill="var(--icon-strong)"
                      leadingIcon={icon}
                      aria-label={label}
                      aria-disabled={disabledReason ? true : undefined}
                      iconOnly
                      variant="ghost"
                      size="medium"
                      onClick={onSelect}
                    />
                  </ToolTip>
                ))}
              </div>
            </div>
          </Popover.Header>
        )}
        <Popover.Body className={`${darkMode && 'dark-theme'}`}>
          <div className="pb-2">
            <div className="col">
              <label className="form-label">{type === 'default' ? 'Page name' : 'Label'}</label>
              <input
                type="text"
                className="form-control"
                value={pageName}
                autoFocus={true}
                onChange={(e) => setPageName(e.target.value)}
                onBlur={() => {
                  pageName && pageName !== savedPage?.name && updatePageName(page?.id, pageName);
                }}
                minLength="1"
                maxLength="32"
              />
            </div>
          </div>
          {type === 'default' && (
            <div className="pb-2">
              <div className="col">
                <label className="form-label">Handle</label>
                <input
                  type="text"
                  className={`form-control ${error ? 'is-invalid' : ''}`}
                  onChange={(e) => onChangePageHandleValue(e)}
                  onBlur={() => handleSave()}
                  value={handle}
                  minLength="1"
                  maxLength="32"
                />
                <div className="invalid-feedback" data-cy={'page-handle-invalid-feedback'}>
                  {error}
                </div>
              </div>
            </div>
          )}
          {type === 'url' && (
            <div className="pb-2">
              <div className="col">
                <label className="form-label">URL</label>
                <textarea
                  onChange={(e) => setPageURL(e.target.value)}
                  className="form-control"
                  value={pageURL}
                  onBlur={(e) => savedPage?.url !== e.target.value && updatePageURL(page?.id, pageURL)}
                  minLength="1"
                />
              </div>
            </div>
          )}
          {type === 'app' && (
            <div className="pb-2">
              <div className="col d-flex justify-content-between align-items-center">
                <label className="form-label">Select app</label>
                <Select
                  options={appOptions}
                  search={true}
                  value={
                    isTargetMissing
                      ? { label: 'Undefined app', value: page?.targetCorelationId }
                      : page?.targetCorelationId
                  }
                  onChange={(value) => {
                    const selected = appOptions.find((opt) => opt.value === value);
                    updatePageTargetApp(
                      page?.id,
                      value,
                      selected?.slug ?? null,
                      selected?.currentVersionId ?? null,
                      moduleId
                    );
                  }}
                  isLoading={appOptionsLoading}
                  placeholder={'Select...'}
                  useMenuPortal={false}
                  width={'168px'}
                  borderRadius="6px"
                  styles={{
                    border: `1px solid ${isInvalid ? 'var(--border-danger-strong)' : 'var(--border-default)'} !important`,
                  }}
                  className={`app-select ${darkMode ? 'select-search-dark' : 'select-search'}`}
                />
              </div>
              {isInvalid && (
                <div className="tw-mt-1 tw-flex tw-items-center tw-gap-1">
                  <AlertTriangle className="tw-h-[12px] tw-w-[12px] tw-shrink-0 tw-text-[var(--icon-danger)]" />
                  <span className="tw-font-['IBM_Plex_Sans'] tw-text-[11px]/[16px] tw-font-[400] tw-text-editor-text-danger">
                    {linkedAppErrorMessage}
                  </span>
                </div>
              )}
            </div>
          )}
          {['url', 'app'].includes(type) && (
            <div className="d-flex justify-content-between align-items-center pb-2">
              <label className="form-label">Open {type === 'url' ? 'URL' : 'app'} in</label>
              <div className="ms-auto position-relative app-mode-switch">
                <ToggleGroup
                  onValueChange={(value) => {
                    updatePageTarget(page?.id, value);
                  }}
                  defaultValue={page?.openIn}
                >
                  {OPEN_APP_MODES.map((mode) => (
                    <ToggleGroupItem key={mode.value} value={mode.value}>
                      {mode.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            </div>
          )}
          <div className="pb-3">
            <div className="d-flex justify-content-between align-items-center">
              <label className="form-label font-weight-400 mb-0">Icon</label>
              <Icon
                isVisibilityEnabled={false}
                onChange={(value) => updatePageIcon(page?.id, value)}
                value={page?.icon || 'IconFile'}
              />
            </div>
          </div>
          <div className={`${['default', 'custom'].includes(type) ? 'pb-3' : ''}`}>
            {type === 'default' && (
              <div className=" d-flex justify-content-between align-items-center pb-2">
                <label className="form-label font-weight-400 mb-0">Mark as home</label>
                <label className={`form-switch`}>
                  <input
                    aria-label="Mark as home"
                    className="form-check-input"
                    type="checkbox"
                    checked={isHomePage}
                    onChange={() => markAsHomePage(page?.id)}
                    disabled={isHomePage || resolveReferences(page?.hidden?.value) || page?.disabled}
                  />
                </label>
              </div>
            )}
            <HidePageOnNavigation
              hidden={page?.hidden}
              disabled={['default', 'custom'].includes(type) ? page?.disabled : false}
              page={page}
              updatePageVisibility={updatePageVisibility}
              darkMode={darkMode}
              isHomePage={isHomePage}
            />
            {type === 'default' && (
              <div className=" d-flex justify-content-between align-items-center pb-2">
                <label className="form-label font-weight-400 mb-0">Disable page</label>
                <label className={`form-switch`}>
                  <input
                    aria-label="Disable page"
                    className="form-check-input"
                    type="checkbox"
                    checked={page?.disabled}
                    onChange={() => disableOrEnablePage(page?.id, !page.disabled)}
                    disabled={isHomePage}
                  />
                </label>
              </div>
            )}
          </div>
          <div className="pb-3">
            <div className="section-header pb-2">Page header</div>
            <div className=" d-flex justify-content-between align-items-center pb-2">
              <label style={{ gap: '6px' }} className="form-label font-weight-400 mb-0 d-flex">
                Show on desktop
                <LicenseTooltip
                  message={"You don't have access to page headers. Upgrade your plan to access this feature."}
                  placement="bottom"
                  show={!hasCanvasPageHeaderEnabled}
                  tooltipClassName="page-paid-tooltip"
                >
                  <div className="d-flex align-items-center">
                    {!hasCanvasPageHeaderEnabled && <SolidIcon name="enterprisecrown" />}
                  </div>
                </LicenseTooltip>
              </label>
              <label className={`form-switch`}>
                <input
                  aria-label="Show page header on desktop"
                  className="form-check-input"
                  type="checkbox"
                  checked={showPageHeaderOnDesktop ?? false}
                  disabled={!hasCanvasPageHeaderEnabled}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    togglePageHeader(page?.id, checked, 'desktop');
                  }}
                />
              </label>
            </div>
            <div className=" d-flex justify-content-between align-items-center pb-2">
              <label style={{ gap: '6px' }} className="form-label font-weight-400 mb-0 d-flex">
                Show on mobile
                <LicenseTooltip
                  message={"You don't have access to page headers. Upgrade your plan to access this feature."}
                  placement="bottom"
                  show={!hasCanvasPageHeaderEnabled}
                  tooltipClassName="page-paid-tooltip"
                >
                  <div className="d-flex align-items-center">
                    {!hasCanvasPageHeaderEnabled && <SolidIcon name="enterprisecrown" />}
                  </div>
                </LicenseTooltip>
              </label>
              <label className={`form-switch`}>
                <input
                  aria-label="Show page header on mobile"
                  className="form-check-input"
                  type="checkbox"
                  checked={showPageHeaderOnMobile ?? false}
                  disabled={!hasCanvasPageHeaderEnabled}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    togglePageHeader(page?.id, checked, 'mobile');
                  }}
                />
              </label>
            </div>
          </div>
          <div className="pb-3">
            <div className="section-header pb-2">Page footer</div>
            <div className=" d-flex justify-content-between align-items-center pb-2">
              <label style={{ gap: '6px' }} className="form-label font-weight-400 mb-0 d-flex">
                Show on desktop
                <LicenseTooltip
                  message={"You don't have access to page footers. Upgrade your plan to access this feature."}
                  placement="bottom"
                  show={!hasCanvasPageFooterEnabled}
                  tooltipClassName="page-paid-tooltip"
                >
                  <div className="d-flex align-items-center">
                    {!hasCanvasPageFooterEnabled && <SolidIcon name="enterprisecrown" />}
                  </div>
                </LicenseTooltip>
              </label>
              <label className={`form-switch`}>
                <input
                  aria-label="Show page footer on desktop"
                  className="form-check-input"
                  type="checkbox"
                  checked={showPageFooterOnDesktop ?? false}
                  disabled={!hasCanvasPageFooterEnabled}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    togglePageFooter(page?.id, checked, 'desktop');
                  }}
                />
              </label>
            </div>
            <div className=" d-flex justify-content-between align-items-center pb-2">
              <label style={{ gap: '6px' }} className="form-label font-weight-400 mb-0 d-flex">
                Show on mobile
                <LicenseTooltip
                  message={"You don't have access to page footers. Upgrade your plan to access this feature."}
                  placement="bottom"
                  show={!hasCanvasPageFooterEnabled}
                  tooltipClassName="page-paid-tooltip"
                >
                  <div className="d-flex align-items-center">
                    {!hasCanvasPageFooterEnabled && <SolidIcon name="enterprisecrown" />}
                  </div>
                </LicenseTooltip>
              </label>
              <label className={`form-switch`}>
                <input
                  aria-label="Show page footer on mobile"
                  className="form-check-input"
                  type="checkbox"
                  checked={showPageFooterOnMobile ?? false}
                  disabled={!hasCanvasPageFooterEnabled}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    togglePageFooter(page?.id, checked, 'mobile');
                  }}
                />
              </label>
            </div>
          </div>
          {['default', 'custom'].includes(type) && (
            <PageEvents
              type={type}
              page={page}
              allPages={pages}
              onNestedPopoverOpenChange={onNestedPopoverOpenChange}
            />
          )}
        </Popover.Body>
      </Popover>
    );
  }
);

const PageEvents = ({ type, page, allPages, onNestedPopoverOpenChange }) => {
  const getComponents = useStore((state) => state.getCurrentPageComponents);
  const components = getComponents();

  return (
    <div className="page-events">
      <div className="section-header pb-2">{PAGE_EVENTS_META[type].title}</div>
      <div className="page-events-list">
        <EventManager
          component={{
            component: {
              definition: {
                events: page?.events ?? [],
              },
            },
          }}
          sourceId={page?.id}
          eventSourceType="page"
          eventMetaDefinition={{ events: PAGE_EVENTS_META[type].events, name: 'page' }}
          components={components}
          pages={allPages}
          popOverCallback={(showing) => onNestedPopoverOpenChange?.(showing)}
        />
      </div>
    </div>
  );
};

const HidePageOnNavigation = ({ hidden, darkMode, updatePageVisibility, page, isHomePage, disabled }) => {
  const resolvePageHiddenValue = useStore((state) => state.resolvePageHiddenValue);
  const [forceCodeBox, setForceCodeBox] = useState(hidden?.fxActive);

  return (
    <div className={cx({ 'codeShow-active': forceCodeBox, disabled: disabled }, 'wrapper-div-code-editor pb-2')}>
      <div className={cx('d-flex align-items-center justify-content-between')}>
        <div className={`field`}>
          <InspectorTooltip
            label={`${page?.type === 'default' ? 'Hide this page on navigation' : 'Hide this item on navigation'}`}
            labelClass={`form-label font-weight-400 ${forceCodeBox ? 'mb-2' : 'mb-0'}`}
          />
        </div>
        <div className={`flex-grow-1`}>
          <div
            style={{ marginBottom: forceCodeBox ? '0.5rem' : '0px' }}
            className={`d-flex align-items-center justify-content-end`}
          >
            {!isHomePage && (
              <div className={`col-auto pt-0 mx-1 fx-button-container ${forceCodeBox && 'show-fx-button-container'}`}>
                <FxButton
                  disabled={isHomePage}
                  active={forceCodeBox}
                  onPress={() => {
                    if (forceCodeBox) {
                      setForceCodeBox(false);
                    } else {
                      setForceCodeBox(true);
                    }
                  }}
                />
              </div>
            )}
            {!forceCodeBox && (
              <div className="form-switch m-0">
                <input
                  aria-label={`Hide this ${page?.type === 'default' ? 'page' : 'item'} on navigation`}
                  className="form-check-input"
                  type="checkbox"
                  checked={resolveReferences(hidden?.value)}
                  disabled={isHomePage}
                  onChange={(e) => {
                    updatePageVisibility(page?.id, {
                      value: `{{${e.target.checked}}}`,
                      fxActive: forceCodeBox,
                    });

                    resolvePageHiddenValue('canvas', true, page?.id, `{{${e.target.checked}}}`);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      {forceCodeBox && (
        <CodeHinter
          initialValue={hidden?.value}
          lang="javascript"
          lineNumbers={false}
          onChange={(value) => {
            updatePageVisibility(page?.id, {
              value: value,
              fxActive: forceCodeBox,
            });
            resolvePageHiddenValue('canvas', true, page?.id, value);
          }}
        />
      )}
    </div>
  );
};

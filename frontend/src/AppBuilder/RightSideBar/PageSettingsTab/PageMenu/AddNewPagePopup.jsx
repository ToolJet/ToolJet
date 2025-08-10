import React, { forwardRef, useCallback, useEffect, useState } from 'react';
import cx from 'classnames';
import { Popover } from 'react-bootstrap';
import useStore from '@/AppBuilder/_stores/store';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { Button } from '@/_ui/LeftSidebar';
import { Icon } from '@/AppBuilder/CodeBuilder/Elements/Icon';
import { EventManager } from '../../Inspector/EventManager';
import { kebabCase } from 'lodash';
import Select from '@/_ui/Select';
import ToggleGroup from '@/ToolJetUI/SwitchGroup/ToggleGroup';
import ToggleGroupItem from '@/ToolJetUI/SwitchGroup/ToggleGroupItem';
import { appService } from '@/_services';
import { ToolTip } from '@/_components';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import CodeHinter from '@/AppBuilder/CodeEditor';
import FxButton from '@/Editor/CodeBuilder/Elements/FxButton';
import { resolveReferences, validateKebabCase } from '@/_helpers/utils';
import { ToolTip as InspectorTooltip } from '../../Inspector/Elements/Components/ToolTip';

const POPOVER_TITLES = {
  add: {
    default: 'New page',
    app: 'New nav item with app',
    url: 'New nav item with URL',
    group: 'New nav group',
  },
  edit: {
    default: 'Edit page',
    app: 'Edit nav item',
    url: 'Edit nav item',
    group: 'Edit nav group',
  },
};

const OPEN_APP_MODES = [
  { label: 'New tab', value: 'new_tab' },
  { label: 'Same tab', value: 'same_tab' },
];

const POPOVER_ACTIONS = {
  default: 'page',
  url: 'page',
  app: 'page',
  group: 'group',
};

export const AddEditPagePopup = forwardRef(({ darkMode, ...props }, ref) => {
  const { moduleId } = useModuleContext();
  const { show, mode, type } = useStore((state) => state.newPagePopupConfig);
  const editingPage = useStore((state) => state.editingPage);
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
  const updatePageAppId = useStore((state) => state.updatePageAppId);
  const currentPageId = useStore((state) => state.currentPageId);
  const setCurrentPageHandle = useStore((state) => state.setCurrentPageHandle);
  const openPageEditPopover = useStore((state) => state.openPageEditPopover);
  const appId = useStore((state) => state.appStore.modules[moduleId].app.homePageId);

  const [page, setPage] = useState(editingPage || props?.page);
  const [pageName, setPageName] = useState('');
  const [handle, setHandle] = useState('');
  const [pageURL, setPageURL] = useState('');
  const [hasAutoSaved, setHasAutoSaved] = useState(false);
  const [error, setError] = useState(null);

  const allpages = pages.filter((p) => p.id !== page?.id);
  const isHomePage = page?.id === homePageId;

  //Nav item with app
  const [appOptions, setAppOptions] = useState([]);
  const [appOptionsLoading, setAppOptionsLoading] = useState(true);

  useEffect(() => {
    setError(null);
  }, [show]);

  useEffect(() => {
    if (mode === 'add' && type === 'default' && !hasAutoSaved) {
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

      setHasAutoSaved(true);
    } else if (editingPage) {
      setPage(editingPage);
      setPageName(editingPage.name);
      setHandle(editingPage.handle);
    }
  }, [mode, hasAutoSaved, pages, editingPage, addNewPage, isPageGroup, type]);

  //Nav item with URL hooks
  useEffect(() => {
    if (mode === 'add' && type === 'url' && !hasAutoSaved) {
      const existingNames = pages.map((p) => p.name.toLowerCase());
      let index = 1;
      let newName = `URL ${index}`;
      while (existingNames.includes(newName.toLowerCase())) {
        index++;
        newName = `URL ${index}`;
      }
      const pageObj = { type: 'url', openIn: 'new_tab', url: 'https://www.tooljet.ai' };
      addNewPage(newName, kebabCase(newName.toLowerCase()), isPageGroup, pageObj).then((data) => {
        setPage(data);
        setPageName(newName);
        setPageURL(data?.url);
      });

      setHasAutoSaved(true);
    } else if (editingPage) {
      setPage(editingPage);
      setPageName(editingPage.name);
      setPageURL(editingPage.url);
    }
  }, [addNewPage, appOptions, editingPage, hasAutoSaved, isPageGroup, mode, pages, type]);

  //Nav item with app hooks
  useEffect(() => {
    const fetchApps = async (page) => {
      const { apps } = await appService.getAll(page);
      return apps;
    };

    // eslint-disable-next-line no-inner-declarations
    async function getAllApps() {
      const apps = await fetchApps(0);
      let appsOptionsList = [];
      apps
        .filter((item) => item.slug !== undefined && item.id !== appId && item.current_version_id)
        .forEach((item) => {
          appsOptionsList.push({
            name: item.name,
            value: item.slug,
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
    if (mode === 'add' && type === 'app' && !hasAutoSaved) {
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

      setHasAutoSaved(true);
    } else if (editingPage) {
      setPage(editingPage);
      setPageName(editingPage.name);
    }
  }, [mode, hasAutoSaved, pages, editingPage, addNewPage, isPageGroup, type, appId]);

  //Nav item with group
  useEffect(() => {
    if (mode === 'add' && type === 'group' && !hasAutoSaved) {
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

      setHasAutoSaved(true);
    } else if (editingPage) {
      setPage(editingPage);
      setPageName(editingPage.name);
    }
  }, [mode, hasAutoSaved, pages, editingPage, addNewPage, isPageGroup, type, appId]);

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
    if (handle === page.handle) {
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

  return (
    <Popover
      id="add-new-page-popup"
      ref={ref}
      {...props}
      className={`add-new-page-popup ${darkMode && 'dark-theme theme-dark'}`}
    >
      <Popover.Header>
        <div className="d-flex justify-content-between align-items-center">
          <div className="tj-text-xsm font-weight-500 text-default">{POPOVER_TITLES?.[mode]?.[type]}</div>
          <div className="actions-container">
            {type !== 'group' && (
              <>
                <ToolTip message={'Go to page'} placement="bottom">
                  <div onClick={handlePageSwitch} className="icon-btn">
                    <SolidIcon name="arrowright01" />
                  </div>
                </ToolTip>
              </>
            )}

            <ToolTip message={`Duplicate ${POPOVER_ACTIONS[type]}`} placement="bottom">
              <div onClick={() => (type === 'group' ? cloneGroup(page?.id) : clonePage(page?.id))} className="icon-btn">
                <SolidIcon name="duplicatepage" />
              </div>
            </ToolTip>

            <ToolTip message={`Delete ${POPOVER_ACTIONS[type]}`} placement="bottom">
              <div
                onClick={() => {
                  openPageEditPopover(page);
                  toggleDeleteConfirmationModal(true);
                }}
                className="icon-btn"
              >
                <SolidIcon name="delete01" />
              </div>
            </ToolTip>
          </div>
        </div>
      </Popover.Header>
      <Popover.Body className={`${darkMode && 'dark-theme'}`}>
        {type === 'default' && (
          <>
            <div className="pb-2">
              <div className="col">
                <label className="form-label font-weight-400 mb-0">Page name</label>
                <input
                  type="text"
                  className="form-control"
                  value={pageName}
                  autoFocus={true}
                  onChange={(e) => setPageName(e.target.value)}
                  onBlur={(e) => {
                    pageName && pageName !== page?.name && updatePageName(page?.id, pageName);
                  }}
                  minLength="1"
                  maxLength="32"
                />
              </div>
            </div>
            <div className="pb-2">
              <div className="col">
                <label className="form-label font-weight-400 mb-0">Handle</label>
                <input
                  type="text"
                  className={`form-control ${error ? 'is-invalid' : ''}`}
                  onChange={(e) => onChangePageHandleValue(e)}
                  onBlur={(e) => handleSave(e)}
                  value={handle}
                  minLength="1"
                  maxLength="32"
                />
                <div className="invalid-feedback" data-cy={'page-handle-invalid-feedback'}>
                  {error}
                </div>
              </div>
            </div>
            <div className="pb-1">
              <div className="d-flex justify-content-between align-items-center pb-2">
                <label className="form-label font-weight-400 mb-0">Icon</label>
                <Icon
                  isVisibilityEnabled={false}
                  onChange={(value) => updatePageIcon(page?.id, value)}
                  value={page?.icon || 'IconFile'}
                />
              </div>
            </div>
            <div className="pb-2">
              <div className=" d-flex justify-content-between align-items-center pb-2">
                <label className="form-label font-weight-400 mb-0">Mark as home</label>
                <label className={`form-switch`}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={isHomePage}
                    onChange={() => markAsHomePage(page?.id)}
                    disabled={isHomePage || resolveReferences(page?.hidden?.value) || page?.disabled}
                  />
                </label>
              </div>
              <HidePageOnNavigation
                hidden={page?.hidden}
                disabled={page?.disabled}
                page={page}
                updatePageVisibility={updatePageVisibility}
                darkMode={darkMode}
                isHomePage={isHomePage}
              />
              <div className=" d-flex justify-content-between align-items-center pb-2">
                <label className="form-label font-weight-400 mb-0">Disable page</label>
                <label className={`form-switch`}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={page?.disabled}
                    onChange={(e) => disableOrEnablePage(page?.id, !page.disabled)}
                    disabled={isHomePage}
                  />
                </label>
              </div>
            </div>
            <PageEvents page={page} allPages={pages} />
          </>
        )}
        {type === 'url' && (
          <>
            <div className="pb-2">
              <div className="col">
                <label className="form-label font-weight-400 mb-0">Label</label>
                <input
                  type="text"
                  onChange={(e) => setPageName(e.target.value)}
                  className="form-control"
                  value={pageName}
                  autoFocus={true}
                  onBlur={(e) => {
                    pageName && pageName !== page?.name && updatePageName(page?.id, pageName);
                  }}
                  minLength="1"
                  maxLength="32"
                />
              </div>
            </div>
            <div className="pb-2">
              <div className="col">
                <label className="form-label font-weight-400 mb-0">URL</label>
                <textarea
                  onChange={(e) => setPageURL(e.target.value)}
                  className="form-control"
                  value={pageURL}
                  onBlur={(e) => page?.url !== e.target.value && updatePageURL(page?.id, pageURL)}
                  minLength="1"
                />
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center pb-2">
              <label className="form-label font-weight-400 mb-0">Open URL in</label>
              <div className="ms-auto position-relative app-mode-switch" style={{ paddingLeft: '0px' }}>
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
            <div className="pb-2">
              <div className="d-flex justify-content-between align-items-center">
                <label className="form-label font-weight-400 mb-0">Icon</label>
                <Icon
                  isVisibilityEnabled={false}
                  onChange={(value) => updatePageIcon(page?.id, value)}
                  value={page?.icon || 'IconFile'}
                />
              </div>
            </div>
            <HidePageOnNavigation
              hidden={page?.hidden}
              page={page}
              updatePageVisibility={updatePageVisibility}
              darkMode={darkMode}
              isHomePage={isHomePage}
            />
          </>
        )}
        {type === 'app' && (
          <>
            <div className="pb-2">
              <div className="col">
                <label className="form-label font-weight-400 mb-0">Label</label>
                <input
                  type="text"
                  onChange={(e) => setPageName(e.target.value)}
                  className="form-control"
                  value={pageName}
                  autoFocus={true}
                  onBlur={(e) => {
                    pageName && pageName !== page?.name && updatePageName(page?.id, pageName);
                  }}
                  minLength="1"
                  maxLength="32"
                />
              </div>
            </div>
            <div className="pb-2">
              <div className="col d-flex justify-content-between align-items-center">
                <label className="form-label font-weight-400 mb-0">Select app</label>
                <Select
                  options={appOptions}
                  search={true}
                  value={page?.appId}
                  onChange={(value) => {
                    updatePageAppId(page?.id, value);
                  }}
                  isLoading={appOptionsLoading}
                  placeholder={'Select...'}
                  useMenuPortal={false}
                  width={'168px'}
                  className={`${darkMode ? 'select-search-dark' : 'select-search'}`}
                />
              </div>
            </div>
            <div className="d-flex justify-content-between align-items-center pb-2">
              <label className="form-label font-weight-400 mb-0">Icon</label>
              <Icon
                isVisibilityEnabled={false}
                onChange={(value) => updatePageIcon(page?.id, value)}
                value={page?.icon || 'IconFile'}
              />
            </div>
            <div className="d-flex justify-content-between align-items-center pb-2">
              <label className="form-label font-weight-400 mb-0">Open app in</label>
              <div className="ms-auto position-relative app-mode-switch" style={{ paddingLeft: '0px' }}>
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
            <HidePageOnNavigation
              hidden={page?.hidden}
              page={page}
              updatePageVisibility={updatePageVisibility}
              darkMode={darkMode}
              isHomePage={isHomePage}
            />
          </>
        )}
        {type === 'group' && (
          <>
            <div className="pb-2">
              <div className="col">
                <label className="form-label font-weight-400 mb-0">Label</label>
                <input
                  type="text"
                  className="form-control"
                  value={pageName}
                  autoFocus={true}
                  onChange={(e) => setPageName(e.target.value)}
                  onBlur={(e) => pageName && pageName !== page?.name && updatePageName(page?.id, pageName, true)}
                  minLength="1"
                  maxLength="32"
                />
              </div>
            </div>
            <div className="pb-2">
              <div className="d-flex justify-content-between align-items-center">
                <label className="form-label font-weight-400 mb-0">Icon</label>
                <Icon
                  isVisibilityEnabled={false}
                  onChange={(value) => updatePageIcon(page?.id, value)}
                  value={page?.icon || 'IconFolder'}
                />
              </div>
            </div>
            <HidePageOnNavigation
              hidden={page?.hidden}
              page={page}
              updatePageVisibility={updatePageVisibility}
              darkMode={darkMode}
              isHomePage={isHomePage}
            />
          </>
        )}
      </Popover.Body>
    </Popover>
  );
});

const PageEvents = ({ page, allPages }) => {
  const getComponents = useStore((state) => state.getCurrentPageComponents);
  const components = getComponents();
  return (
    <div className="page-events">
      <div className="section-header pb-2">Page events</div>
      {/* <div className="page-empty-events">
        <SolidIcon name="nopageevents" />
        <span className="tj-text-xsm">No events added</span>
      </div> */}
      <div>
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
          eventMetaDefinition={{ events: { onPageLoad: { displayName: 'On page load' } }, name: 'page' }}
          components={components}
          pages={allPages}
          popOverCallback={(showing) => showing}
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
            labelClass={`tj-text-xsm color-slate12 ${forceCodeBox ? 'mb-2' : 'mb-0'} ${
              darkMode && 'color-whitish-darkmode'
            }`}
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

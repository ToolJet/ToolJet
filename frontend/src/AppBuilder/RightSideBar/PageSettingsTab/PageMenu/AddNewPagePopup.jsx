import React, { forwardRef, useEffect, useState } from 'react';
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

const POPOVER_TITLES = {
  add: {
    page: 'New page',
    app: 'New nav item with app',
    url: 'New nav item with URL',
    group: 'New nav group',
  },
  edit: {
    page: 'Edit page',
    app: 'Edit nav item',
    url: 'New nav item',
    group: 'Edit nav group',
  },
};

const OPEN_APP_MODES = [
  { label: 'New tab', value: 'new_tab' },
  { label: 'Same tab', value: 'same_tab' },
];

export const AddEditPagePopup = forwardRef(({ darkMode, ...props }, ref) => {
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
  const isPageGroup = useStore((state) => state.isPageGroup);
  const homePageId = useStore((state) => state.app.homePageId);
  const updatePageVisibility = useStore((state) => state.updatePageVisibility);
  const disableOrEnablePage = useStore((state) => state.disableOrEnablePage);
  const updatePageAppId = useStore((state) => state.updatePageAppId);

  const [page, setPage] = useState(editingPage);
  const [pageName, setPageName] = useState('');
  const [handle, setHandle] = useState('');
  const [pageURL, setPageURL] = useState('');
  const [hasAutoSaved, setHasAutoSaved] = useState(false);

  const allpages = pages.filter((p) => p.id !== page?.id);
  const isHomePage = page?.id === homePageId;

  //Nav item with app
  const [appOptions, setAppOptions] = useState([]);
  const [appOptionsLoading, setAppOptionsLoading] = useState(true);
  const appId = useStore((state) => state.app.appId);

  useEffect(() => {
    if (mode === 'add' && type === 'page' && !hasAutoSaved) {
      const existingNames = pages.map((p) => p.name.toLowerCase());
      let index = 1;
      let newName = `Page ${index}`;
      while (existingNames.includes(newName.toLowerCase())) {
        index++;
        newName = `Page ${index}`;
      }
      addNewPage(newName, kebabCase(newName.toLowerCase()), isPageGroup).then((data) => {
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
  }, [mode, hasAutoSaved, pages, editingPage, addNewPage, pageName, isPageGroup, type]);

  //Nav item with URL hooks
  useEffect(() => {
    if (mode === 'add' && type === 'url' && !hasAutoSaved) {
      const existingNames = pages.map((p) => p.name.toLowerCase());
      let index = 1;
      let newName = `Page ${index}`;
      while (existingNames.includes(newName.toLowerCase())) {
        index++;
        newName = `Page ${index}`;
      }
      const pageObj = { type: 'url', openIn: 'new_tab' };
      addNewPage(newName, kebabCase(newName.toLowerCase()), isPageGroup, pageObj).then((data) => {
        setPage(data);
        setPageName(newName);
        setPageURL(data?.url);
      });

      setHasAutoSaved(true);
    } else if (mode === 'edit' && editingPage) {
      setPage(editingPage, appOptions);
      setPageName(editingPage.name);
      setPageURL(editingPage.url);
    }
  }, [addNewPage, appOptions, editingPage, hasAutoSaved, isPageGroup, mode, pages, type]);

  //Nav item with app hooks
  useEffect(() => {
    if (mode === 'add' && type === 'app' && !hasAutoSaved) {
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

      const existingNames = pages.map((p) => p.name.toLowerCase());
      let index = 1;
      let newName = `Page ${index}`;
      while (existingNames.includes(newName.toLowerCase())) {
        index++;
        newName = `Page ${index}`;
      }
      const pageObj = { type: 'url', openIn: 'new_tab' };
      addNewPage(newName, kebabCase(newName.toLowerCase()), isPageGroup, pageObj).then((data) => {
        setPage(data);
        setPageName(newName);
      });

      setHasAutoSaved(true);
    } else if (editingPage) {
      setPage(editingPage);
      setPageName(editingPage.name);
    }
  }, [mode, hasAutoSaved, pages, editingPage, addNewPage, pageName, isPageGroup, type, appId]);

  //Nav item with group
  useEffect(() => {
    if (mode === 'add' && type === 'group' && !hasAutoSaved) {
      const existingNames = pages.map((p) => p.name.toLowerCase());
      let index = 1;
      let newName = `Page ${index}`;
      while (existingNames.includes(newName.toLowerCase())) {
        index++;
        newName = `Page ${index}`;
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
  }, [mode, hasAutoSaved, pages, editingPage, addNewPage, pageName, isPageGroup, type, appId]);

  return (
    <Popover id="add-new-page-popup" ref={ref} {...props} className={`${darkMode && 'dark-theme'}`}>
      <Popover.Header>
        <div className="d-flex justify-content-between align-items-center">
          <div className="tj-text-xsm font-weight-500 text-default">{POPOVER_TITLES?.[mode]?.[type]}</div>
          <div className="actions-container">
            <div className="icon-btn">
              <SolidIcon name="arrowright01" />
            </div>
            <div className="icon-btn">
              <SolidIcon name="duplicatepage" />
            </div>
            <div className="icon-btn">
              <SolidIcon name="delete01" />
            </div>
          </div>
        </div>
      </Popover.Header>
      <Popover.Body className={`${darkMode && 'dark-theme'}`}>
        {type === 'page' && (
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
                  onBlur={(e) => pageName !== e.target.value && updatePageName(page?.id, pageName)}
                  minLength="1"
                />
              </div>
            </div>
            <div className="pb-2">
              <div className="col">
                <label className="form-label font-weight-400 mb-0">Handle</label>
                <input
                  type="text"
                  className="form-control"
                  onChange={(e) => setHandle(e.target.value)}
                  onBlur={() => updatePageHandle(page?.id, handle)}
                  value={handle}
                  minLength="1"
                />
              </div>
            </div>
            <div className="pb-1">
              <div className="d-flex justify-content-between align-items-center pb-2">
                <label className="form-label font-weight-400 mb-0">Icon</label>
                <Icon onChange={(value) => updatePageIcon(page?.id, value)} value={page?.icon || 'IconHome'} />
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
                    disabled={isHomePage}
                  />
                </label>
              </div>
              <div className=" d-flex justify-content-between align-items-center pb-2">
                <label className="form-label font-weight-400 mb-0">Hide this page on navigation</label>
                <label className={`form-switch`}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={page?.hidden}
                    onChange={(e) => updatePageVisibility(page?.id, !page?.hidden)}
                    disabled={isHomePage}
                  />
                </label>
              </div>
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
                  onBlur={(e) => pageName !== e.target.value && updatePageName(page?.id, pageName)}
                  minLength="1"
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
                  onBlur={(e) => pageURL !== e.target.value && updatePageURL(page?.id, pageURL)}
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
                <Icon onChange={(value) => updatePageIcon(page?.id, value)} value={page?.icon} />
              </div>
            </div>
            <div className=" d-flex justify-content-between align-items-center">
              <label className="form-label font-weight-400 mb-0">Hide this item on navigation</label>
              <label className={`form-switch`}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={page?.hidden}
                  onChange={(e) => updatePageVisibility(page?.id, !page?.hidden)}
                  disabled={isHomePage}
                />
              </label>
            </div>
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
                  onBlur={(e) => pageName !== e.target.value && updatePageName(page?.id, pageName)}
                  minLength="1"
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
              <Icon onChange={(value) => updatePageIcon(page?.id, value)} value={page?.icon} />
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
            <div className=" d-flex justify-content-between align-items-center">
              <label className="form-label font-weight-400 mb-0">Hide this item on navigation</label>
              <label className={`form-switch`}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={page?.hidden}
                  onChange={(e) => updatePageVisibility(page?.id, !page?.hidden)}
                  disabled={isHomePage}
                />
              </label>
            </div>
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
                  onBlur={(e) => pageName !== e.target.value && updatePageName(page?.id, pageName)}
                  minLength="1"
                />
              </div>
            </div>
            <div className="pb-2">
              <div className="d-flex justify-content-between align-items-center">
                <label className="form-label font-weight-400 mb-0">Icon</label>
                <Icon onChange={(value) => updatePageIcon(page?.id, value)} value={page?.icon} />
              </div>
            </div>
            <div className=" d-flex justify-content-between align-items-center">
              <label className="form-label font-weight-400 mb-0">Hide this item on navigation</label>
              <label className={`form-switch`}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={page?.hidden}
                  onChange={(e) => updatePageVisibility(page?.id, !page?.hidden)}
                  disabled={isHomePage}
                />
              </label>
            </div>
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

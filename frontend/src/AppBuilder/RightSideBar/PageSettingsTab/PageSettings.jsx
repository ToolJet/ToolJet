import React, { useCallback, useMemo, useRef, useState } from 'react';
import cx from 'classnames';
import useStore from '@/AppBuilder/_stores/store';
import ArrowLeft from '@/_ui/Icon/solidIcons/ArrowLeft';
import Tabs from '@/ToolJetUI/Tabs/Tabs';
import Tab from '@/ToolJetUI/Tabs/Tab';
import CollapsableToggle from './CollapsableToggle';
import { pageConfig } from './pageConfig';
import Accordion from '@/_ui/Accordion';
import { ColorSwatches } from '@/modules/Appbuilder/components';
import { NumberInput } from '@/Editor/CodeBuilder/Elements/NumberInput';
import LabelStyleToggle from './LabelStyleToggle';
import FxButton from '@/Editor/CodeBuilder/Elements/FxButton';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { resolveReferences } from '@/_helpers/utils';
import { ToolTip } from '../Inspector/Elements/Components/ToolTip';
import OverflowTooltip from '@/_components/OverflowTooltip';
import { RIGHT_SIDE_BAR_TAB } from '../rightSidebarConstants';
import { SortableTree } from './PageMenu/Tree/SortableTree';
import SortableList from '@/_components/SortableList';
import { PageMenuItem } from './PageMenu/PageMenuItem';
import { get } from 'lodash';
import { Button } from '@/components/ui/Button/Button';
import { AddNewPageMenu } from './PageMenu/AddNewPageMenu';
import { AddNewPagePopup } from './PageMenu/AddNewPagePopup';
import ToggleGroup from '@/ToolJetUI/SwitchGroup/ToggleGroup';
import ToggleGroupItem from '@/ToolJetUI/SwitchGroup/ToggleGroupItem';
import Select from '@/_ui/Select';
import { DeletePageConfirmationModal } from './PageMenu/DeletePageConfirmationModal';
import EditAppName from '@/AppBuilder/Header/EditAppName';
import { ToolTip as LicenseTooltip } from '@/_components/ToolTip';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import PagePermission from './PageMenu/PagePermission';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { shallow } from 'zustand/shallow';

export const PageSettings = () => {
  const pageSettings = useStore((state) => state.pageSettings);
  const pageSettingChanged = useStore((state) => state.pageSettingChanged);
  const setActiveRightSideBarTab = useStore((state) => state.setActiveRightSideBarTab);
  const { definition: { properties = {} } = {} } = pageSettings ?? {};
  const [forceCodeBox, setForceCodeBox] = useState(properties?.disableMenu?.fxActive);
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const shouldFreeze = useStore((state) => state.getShouldFreeze());
  const isVersionReleased = useStore((state) => state.isVersionReleased);
  const switchPage = useStore((state) => state.switchPage);
  const toggleRightSidebarPin = useStore((state) => state.toggleRightSidebarPin);
  const isRightSidebarPinned = useStore((state) => state.isRightSidebarPinned);
  const treeRef = useRef(null);

  const license = useStore((state) => state.license);
  const isLicensed =
    !get(license, 'featureAccess.licenseStatus.isExpired', true) &&
    get(license, 'featureAccess.licenseStatus.isLicenseValid', false);

  const pagesMeta = useMemo(() => JSON.parse(JSON.stringify(pageConfig)), []);

  const handleStyleChange = useCallback(
    (name, value, isDefault) => {
      pageSettingChanged({ [name]: { value, isDefault } }, 'styles');
    },
    [pageSettingChanged]
  );

  const renderCustomStyles = useCallback(
    (style, name, defaultValue) => {
      const currentStyles = pageSettings?.definition?.styles || {};
      const handleReset = (e) => {
        e.stopPropagation();
        handleStyleChange(name, defaultValue, true);
      };

      return (
        <div key={name} className={cx('d-flex align-items-center justify-content-between mb-3')}>
          <div className={`field`}>
            <OverflowTooltip style={{ width: '120px' }} childrenClassName={'tj-text-xsm color-slate12 mb-2'}>
              {style.displayName}
            </OverflowTooltip>
          </div>
          {style.type === 'colorSwatches' && (
            <ColorSwatches
              onReset={handleReset}
              value={currentStyles[name]?.value}
              onChange={(value) => handleStyleChange(name, value, false)}
            />
          )}
          {style.type === 'numberInput' && (
            <NumberInput
              value={currentStyles[name]?.value}
              meta={{ staticText: 'px' }}
              onChange={(value) => handleStyleChange(name, value)}
            />
          )}
        </div>
      );
    },
    [handleStyleChange, pageSettings, darkMode]
  );

  const pagesAndMenuItems = [
    {
      title: 'Pages and menu',
      children: [
        isLicensed ? (
          <>
            <PagePermission darkMode={darkMode} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }} ref={treeRef}>
              <SortableTree darkMode={darkMode} collapsible indicator={true} treeRef={treeRef} />
            </div>
          </>
        ) : (
          <SortableList
            Element={PageMenuItem}
            darkMode={darkMode}
            switchPage={switchPage}
            treeRef={treeRef}
            classNames="page-handler"
          />
        ),
        <AddNewPageMenu isLicensed={isLicensed} key="new-page" darkMode={darkMode} />,
      ],
    },
  ];

  const appHeaderMenuItems = [
    {
      title: 'Header and navigation',
      children: [
        <AppHeaderMenu
          pageSettings={pageSettings}
          pageSettingChanged={pageSettingChanged}
          key="header-and-navigation"
          darkMode={darkMode}
          licenseValid={isLicensed}
        />,
        <NavigationMenu
          pageSettings={pageSettings}
          pageSettingChanged={pageSettingChanged}
          key="navigation-menu"
          darkMode={darkMode}
        />,
      ],
    },
  ];

  const devices = [
    {
      title: 'Devices',
      children: [
        <Devices
          pageSettings={pageSettings}
          pageSettingChanged={pageSettingChanged}
          key="devices"
          darkMode={darkMode}
        />,
      ],
    },
  ];

  return (
    <div className="inspector pages-settings">
      <div>
        <div className="row inspector-component-title-input-holder d-flex align-items-center">
          <div className="col-1" onClick={() => setActiveRightSideBarTab(RIGHT_SIDE_BAR_TAB.COMPONENTS)}>
            <span
              data-cy={`inspector-close-icon`}
              className="cursor-pointer d-flex align-items-center "
              style={{ height: '28px', width: '28px' }}
            >
              <ArrowLeft fill={'var(--slate12)'} width={'14'} />
            </span>
          </div>
          <div className={`col-9 p-0 mx-2 ${isVersionReleased && 'disabled'}`}>Pages and navigation</div>
          <div className="d-flex">
            <div className="icon-btn cursor-pointer" onClick={() => toggleRightSidebarPin()}>
              <SolidIcon fill="var(--icon-strong)" name={isRightSidebarPinned ? 'unpin' : 'pin'} width="16" />
            </div>
          </div>
        </div>
        <div>
          <Tabs defaultActiveKey={'properties'} id="page-settings">
            <Tab className="page-selector-panel-body" eventKey="properties" title="Properties">
              <div className={cx({ disabled: isVersionReleased || shouldFreeze })}>
                <div className="tj-text-xsm color-slate12 ">
                  {/* <CollapsableToggle pageSettingChanged={pageSettingChanged} settings={pageSettings} />
                  <LabelStyleToggle pageSettingChanged={pageSettingChanged} settings={pageSettings} />
                  <div className={cx({ 'codeShow-active': forceCodeBox }, 'wrapper-div-code-editor')}>
                    <div className={cx('d-flex align-items-center justify-content-between')}>
                      <div className={`field`}>
                        <ToolTip
                          label={'Hide page menu in viewer mode'}
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
                          <div
                            className={`col-auto pt-0 mx-1 fx-button-container ${
                              forceCodeBox && 'show-fx-button-container'
                            }`}
                          >
                            <FxButton
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

                          {!forceCodeBox && (
                            <div className="form-check form-switch m-0">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={resolveReferences(properties?.disableMenu?.value)}
                                onChange={(e) =>
                                  pageSettingChanged(
                                    {
                                      disableMenu: {
                                        value: `{{${e.target.checked}}}`,
                                        fxActive: forceCodeBox,
                                      },
                                    },
                                    'properties'
                                  )
                                }
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {forceCodeBox && (
                      <CodeHinter
                        initialValue={properties?.disableMenu?.value}
                        lang="javascript"
                        lineNumbers={false}
                        onChange={(value) => {
                          pageSettingChanged(
                            {
                              disableMenu: {
                                value: value,
                                fxActive: forceCodeBox,
                              },
                            },
                            'properties'
                          );
                        }}
                      />
                    )}
                  </div> */}
                  <Accordion className="pages-and-groups-list" items={pagesAndMenuItems} />
                  <Accordion items={appHeaderMenuItems} />
                  <Accordion items={devices} />
                </div>
              </div>
            </Tab>
            <Tab eventKey="styles" title="Styles">
              <div className={cx({ disabled: isVersionReleased })}>
                <div className="tj-text-xsm color-slate12 settings-tab ">
                  <RenderStyles pagesMeta={pagesMeta} renderCustomStyles={renderCustomStyles} />
                </div>
              </div>
            </Tab>
          </Tabs>
          <DeletePageConfirmationModal darkMode={darkMode} />
        </div>
      </div>
    </div>
  );
};

const RenderStyles = React.memo(({ pagesMeta, renderCustomStyles }) => {
  const groupedStyles = {};
  for (const key in pagesMeta.styles) {
    const property = pagesMeta.styles[key];
    const accordion = property.accordion;

    if (!groupedStyles[accordion]) {
      groupedStyles[accordion] = {};
    }

    groupedStyles[accordion][key] = property;
  }

  return Object.keys(groupedStyles).map((style) => {
    const items = [
      {
        title: `${style}`,
        children: Object.entries(groupedStyles[style]).map(([key, value]) => {
          const defaultValue = pagesMeta.definition.styles[key].value;
          return {
            ...renderCustomStyles(value, key, defaultValue),
          };
        }),
      },
    ];
    return <Accordion key={style} items={items} />;
  });
});

const AppHeaderMenu = ({ darkMode, pageSettings, pageSettingChanged, licenseValid }) => {
  const { moduleId } = useModuleContext();
  const [appName] = useStore((state) => [state.appStore.modules[moduleId].app.appName], shallow);

  const { definition: { properties = {} } = {} } = pageSettings ?? {};
  const { hideHeader, name, hideLogo } = properties ?? {};
  const [_name, _setName] = useState(name?.trim() ? name : appName);

  return (
    <>
      <div className="section-header pb-2">
        <div className="title">App header</div>
      </div>
      <div className=" d-flex justify-content-between align-items-center pb-2">
        <label style={{ gap: '6px' }} className="form-label font-weight-400 mb-0 d-flex">
          Show app header
          <LicenseTooltip message={"App header can't be hidden on free plans"} placement="bottom" show={!licenseValid}>
            <div className="d-flex align-items-center">{!licenseValid && <SolidIcon name="enterprisecrown" />}</div>
          </LicenseTooltip>
        </label>
        <label className={`form-switch`}>
          <input
            className="form-check-input"
            type="checkbox"
            checked={licenseValid ? !hideHeader : true}
            disabled={!licenseValid}
            onChange={(e) => {
              pageSettingChanged({ hideHeader: !e.target.checked }, 'properties');
            }}
          />
        </label>
      </div>
      <div className=" d-flex justify-content-between align-items-center pb-2">
        <label style={{ gap: '6px' }} className="form-label font-weight-400 mb-0 d-flex">
          Show logo
        </label>
        <label className={`form-switch`}>
          <input
            className="form-check-input"
            type="checkbox"
            checked={!hideLogo}
            onChange={(e) => {
              pageSettingChanged({ hideLogo: !e.target.checked }, 'properties');
            }}
          />
        </label>
      </div>
      <div className="pb-2">
        <div className="col pb-1">
          <label className="form-label font-weight-400 mb-0">Title</label>
          <input
            type="text"
            onBlur={(e) => {
              pageSettingChanged({ name: e.target.value }, 'properties');
            }}
            onChange={(e) => _setName(e.target.value)}
            className="form-control"
            value={_name}
            minLength="1"
          />
        </div>
      </div>
    </>
  );
};

const NavigationMenu = ({ darkMode, pageSettings, pageSettingChanged }) => {
  const { definition: { properties = {} } = {} } = pageSettings ?? {};
  const { disableMenu, position, style, collapsable } = properties ?? {};
  const resolvedDisableMenu = resolveReferences(disableMenu?.value);

  const POSTIONS = [
    { label: 'Top', value: 'top' },
    { label: 'Side', value: 'side' },
  ];

  const COLLAPSABLE_TOGGLES = [
    { label: 'True', value: 'true' },
    { label: 'False', value: 'false' },
  ];

  const styleOptions = [
    { label: 'Text and icon', value: 'texticon' },
    ...(position == 'side' || position == 'top' ? [{ label: 'Text only', value: 'text' }] : []),
    ...(position !== 'top' ? [{ label: 'Icon only', value: 'icon' }] : []),
  ];

  function stringToBoolean(str) {
    return str.toLowerCase() === 'true';
  }

  return (
    <>
      <div className="section-header pb-2">
        <div className="title">Navigation menu</div>
      </div>
      <div className=" d-flex justify-content-between align-items-center pb-2">
        <label className="form-label font-weight-400 mb-0">Show navigation menu</label>
        <label className={`form-switch`}>
          <input
            className="form-check-input"
            type="checkbox"
            checked={!resolvedDisableMenu}
            onChange={(e) => {
              pageSettingChanged(
                {
                  disableMenu: {
                    value: `{{${!e.target.checked}}}`,
                    fxActive: false,
                  },
                },
                'properties'
              );
            }}
          />
        </label>
      </div>
      {!resolvedDisableMenu && (
        <>
          <div className="d-flex justify-content-between align-items-center pb-2">
            <label className="form-label font-weight-400 mb-0">Position</label>
            <div className="ms-auto position-relative app-mode-switch" style={{ paddingLeft: '0px' }}>
              <ToggleGroup
                onValueChange={(value) => {
                  if (position?.toString() === 'side' && style === 'icon') {
                    pageSettingChanged({ style: 'texticon' }, 'properties');
                  }
                  pageSettingChanged({ position: value }, 'properties');
                }}
                defaultValue={position?.toString()}
              >
                {POSTIONS.map((mode) => (
                  <ToggleGroupItem key={mode.value} value={mode.value}>
                    {mode.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </div>
          <div className="pb-2">
            <div className="col d-flex justify-content-between align-items-center">
              <label className="form-label font-weight-400 mb-0">Style</label>
              <Select
                options={styleOptions}
                search={true}
                value={style}
                onChange={(value) => {
                  pageSettingChanged({ style: value }, 'properties');
                }}
                placeholder={'Select...'}
                useMenuPortal={false}
                width={'142px'}
                className={`${darkMode ? 'select-search-dark' : 'select-search'}`}
              />
            </div>
          </div>
          {position == 'side' && style !== 'text' && style !== 'icon' && (
            <div className="d-flex justify-content-between align-items-center pb-2">
              <label className="form-label font-weight-400 mb-0">Collapsable</label>
              <div className="ms-auto position-relative app-mode-switch" style={{ paddingLeft: '0px' }}>
                <ToggleGroup
                  onValueChange={(value) => {
                    // if (position === 'side' && value == 'false') {
                    //   pageSettingChanged({ style: 'texticon' }, 'properties');
                    // }
                    pageSettingChanged({ collapsable: stringToBoolean(value) }, 'properties');
                  }}
                  defaultValue={collapsable?.toString()}
                >
                  {COLLAPSABLE_TOGGLES.map((mode) => (
                    <ToggleGroupItem key={mode.value} value={mode.value}>
                      {mode.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};

const Devices = ({ darkMode, pageSettingChanged, pageSettings }) => {
  const { definition: { properties = {} } = {} } = pageSettings ?? {};
  const { showOnDesktop, showOnMobile } = properties ?? {};

  return (
    <>
      <div className=" d-flex justify-content-between align-items-center pb-2">
        <label className="form-label font-weight-400 mb-0">Show on desktop</label>
        <label className={`form-switch`}>
          <input
            className="form-check-input"
            type="checkbox"
            checked={showOnDesktop}
            onBlur={(e) => {
              pageSettingChanged({ showOnDesktop: e.target.checked }, 'properties');
            }}
          />
        </label>
      </div>
      <div className=" d-flex justify-content-between align-items-center pb-2">
        <label className="form-label font-weight-400 mb-0">Show on mobile</label>
        <label className={`form-switch`}>
          <input
            className="form-check-input"
            type="checkbox"
            checked={showOnMobile}
            onBlur={(e) => {
              pageSettingChanged({ showOnMobile: e.target.checked }, 'properties');
            }}
          />
        </label>
      </div>
    </>
  );
};

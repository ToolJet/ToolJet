import React, { useCallback, useMemo, useState } from 'react';
import cx from 'classnames';
import useStore from '@/AppBuilder/_stores/store';
import ArrowLeft from '@/_ui/Icon/solidIcons/ArrowLeft';
import Tabs from '@/ToolJetUI/Tabs/Tabs';
import Tab from '@/ToolJetUI/Tabs/Tab';
import CollapsableToggle from './CollapsableToggle';
import { pageConfig } from './pageConfig';
import Accordion from '@/_ui/Accordion';
import { Color } from '@/Editor/CodeBuilder/Elements/Color';
import { NumberInput } from '@/Editor/CodeBuilder/Elements/NumberInput';
import LabelStyleToggle from './LabelStyleToggle';
import FxButton from '@/Editor/CodeBuilder/Elements/FxButton';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { resolveReferences } from '@/_helpers/utils';
import { ToolTip } from '../Inspector/Elements/Components/ToolTip';
import OverflowTooltip from '@/_components/OverflowTooltip';

export const PageSettings = () => {
  const pageSettings = useStore((state) => state.pageSettings);
  const pageSettingChanged = useStore((state) => state.pageSettingChanged);
  const togglePageSettingMenu = useStore((state) => state.togglePageSettingMenu);
  const { definition: { properties = {} } = {} } = pageSettings ?? {};
  const [forceCodeBox, setForceCodeBox] = useState(properties?.disableMenu?.fxActive);
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const shouldFreeze = useStore((state) => state.getShouldFreeze());
  const isVersionReleased = useStore((state) => state.isVersionReleased);

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
          {style.type === 'color' && (
            <Color
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

  return (
    <div className="inspector pages-settings">
      <div>
        <div className="row inspector-component-title-input-holder">
          <div className="col-1" onClick={togglePageSettingMenu}>
            <span
              data-cy={`inspector-close-icon`}
              className="cursor-pointer d-flex align-items-center "
              style={{ height: '28px', width: '28px' }}
            >
              <ArrowLeft fill={'var(--slate12)'} width={'14'} />
            </span>
          </div>
          <div className={`col-9 p-0 mx-2 ${isVersionReleased && 'disabled'}`}>Page menu</div>
        </div>
        <div>
          <Tabs defaultActiveKey={'properties'} id="page-settings">
            <Tab eventKey="properties" title="Properties">
              <div style={{ padding: '12px 16px' }} className={cx({ disabled: isVersionReleased || shouldFreeze })}>
                <div className="tj-text-xsm color-slate12 ">
                  <CollapsableToggle pageSettingChanged={pageSettingChanged} settings={pageSettings} />
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
                  </div>
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

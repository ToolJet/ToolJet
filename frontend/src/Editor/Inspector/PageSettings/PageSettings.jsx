import React from 'react';
import cx from 'classnames';
import ArrowLeft from '@/_ui/Icon/solidIcons/ArrowLeft';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { shallow } from 'zustand/shallow';
import Tabs from '@/ToolJetUI/Tabs/Tabs';
import Tab from '@/ToolJetUI/Tabs/Tab';
import CollapsableToggle from './CollapsableToggle';
import { pageConfig } from './pageConfig';
import Accordion from '@/_ui/Accordion';
import { ToolTip } from '../Elements/Components/ToolTip';
import { Color } from '@/Editor/CodeBuilder/Elements/Color';
import { NumberInput } from '@/Editor/CodeBuilder/Elements/NumberInput';
import LabelStyleToggle from './LabelStyleToggle';
import { useEditorStore } from '@/_stores/editorStore';

export default function PageSettings({ settings, pageSettingsChanged }) {
  const { isVersionReleased } = useAppVersionStore(
    (state) => ({
      isVersionReleased: state.isVersionReleased,
    }),
    shallow
  );

  const pagesMeta = JSON.parse(JSON.stringify(pageConfig));

  const RenderStyles = () => {
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
      const items = [];
      items.push({
        title: `${style}`,
        children: Object.entries(groupedStyles[style]).map(([key, value]) => ({
          ...renderCustomStyles(value, key),
        })),
      });
      return <Accordion key={style} items={items} />;
    });
  };

  const renderCustomStyles = (style, name) => {
    const {
      definition: { styles },
    } = settings;
    return (
      <div className={cx('d-flex align-items-center justify-content-between mb-3')}>
        <div className={`field`}>
          <ToolTip label={style.displayName} labelClass={`tj-text-xsm color-slate12 mb-2`} />
        </div>
        {style.type === 'color' && (
          <Color
            value={styles[name].value}
            onChange={(value) => {
              pageSettingsChanged({ [name]: { value } }, 'styles');
            }}
          />
        )}
        {style.type === 'numberInput' && (
          <NumberInput
            value={styles[name].value}
            meta={{ staticText: 'px' }}
            onChange={(value) => {
              pageSettingsChanged({ [name]: { value } }, 'styles');
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="inspector pages-settings">
      <div>
        <div className="row inspector-component-title-input-holder">
          <div
            className="col-1"
            onClick={() =>
              useEditorStore.getState().actions.updateEditorState({
                pageSettingSelected: false,
                selectedComponents: [],
              })
            }
          >
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
              <div style={{ padding: '12px 16px' }} className={cx({ disabled: isVersionReleased })}>
                <div className="tj-text-xsm color-slate12 ">
                  <CollapsableToggle pageSettingsChanged={pageSettingsChanged} settings={settings} />
                  <LabelStyleToggle pageSettingsChanged={pageSettingsChanged} settings={settings} />
                </div>
              </div>
            </Tab>
            <Tab eventKey="styles" title="Styles">
              <div style={{ padding: '12px 16px' }} className={cx({ disabled: isVersionReleased })}>
                <div className="tj-text-xsm color-slate12 ">
                  <RenderStyles />
                </div>
              </div>
            </Tab>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

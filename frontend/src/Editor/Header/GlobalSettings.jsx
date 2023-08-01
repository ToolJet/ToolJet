import React, { useState } from 'react';
import cx from 'classnames';
import { SketchPicker } from 'react-color';
import { Confirm } from '../Viewer/Confirm';
import { HeaderSection } from '@/_ui/LeftSidebar';
import { LeftSidebarItem } from '../LeftSidebar/SidebarItem';
import FxButton from '../CodeBuilder/Elements/FxButton';
import { CodeHinter } from '../CodeBuilder/CodeHinter';
import { resolveReferences, validateName } from '@/_helpers/utils';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';
import Popover from '@/_ui/Popover';
import { useCurrentState } from '@/_stores/currentStateStore';

export const GlobalSettings = ({
  globalSettings,
  globalSettingsChanged,
  darkMode,
  toggleAppMaintenance,
  is_maintenance_on,
}) => {
  const { t } = useTranslation();
  const { hideHeader, canvasMaxWidth, canvasMaxWidthType, canvasMaxHeight, canvasBackgroundColor, backgroundFxQuery } =
    globalSettings;
  const [showPicker, setShowPicker] = useState(false);
  const currentState = useCurrentState();
  const [forceCodeBox, setForceCodeBox] = useState(true);
  const [realState, setRealState] = useState(currentState);
  const [showConfirmation, setConfirmationShow] = useState(false);
  const [show, setShow] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [fields, setFields] = useState({ name: { value: '', error: '' }, slug: { value: null, error: '' } });
  const [slugProgress, setSlugProgress] = useState(false);
  const [isDisabled, setDisabled] = useState(true);

  const coverStyles = {
    position: 'fixed',
    top: '0px',
    right: '0px',
    bottom: '0px',
    left: '0px',
  };

  React.useEffect(() => {
    setRealState(currentState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentState.components]);

  React.useEffect(() => {
    backgroundFxQuery &&
      globalSettingsChanged('canvasBackgroundColor', resolveReferences(backgroundFxQuery, realState));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(resolveReferences(backgroundFxQuery, realState))]);

  const handleInputChange = (value, field) => {
    setFields({
      ...fields,
      [field]: {
        ...fields[field],
        error: null,
      },
    });
    const error = validateName(
      value,
      `Workspace ${field}`,
      false,
      !(field === 'slug'),
      !(field === 'slug'),
      field === 'slug'
    );
    setFields({
      ...fields,
      [field]: {
        value,
        error: error?.errorMsg,
      },
    });

    const otherInputErrors = Object.keys(fields).find(
      (key) => (key !== field && !_.isEmpty(fields[key].error)) || (key !== field && _.isEmpty(fields[key].value))
    );
    setDisabled(!error?.status || otherInputErrors);
  };

  const delayedSlugChange = _.debounce((value, field) => {
    handleInputChange(value, field);
    setSlugProgress(false);
  }, 500);

  const popoverContent = (
    <div id="global-settings-popover" className={cx({ 'theme-dark': darkMode })}>
      <div bsPrefix="global-settings-popover">
        <HeaderSection darkMode={darkMode}>
          <HeaderSection.PanelHeader title="Global settings" />
        </HeaderSection>
        <div className="card-body">
          <div className="row app-slug">
            <div className="col tj-app-input input-with-icon">
              <label>Unique workspace slug</label>
              <input
                type="text"
                className={`form-control is-valid`}
                placeholder={t('header.organization.workspaceSlug', 'unique workspace slug')}
                disabled={isCreating}
                maxLength={50}
                onChange={(e) => {
                  setSlugProgress(true);
                  e.persist();
                  delayedSlugChange(e.target.value, 'slug');
                }}
                data-cy="workspace-slug-input-field"
                autoFocusfields
              />
              {fields['slug'].value !== null && !fields['slug'].error && (
                <div className="icon-container">
                  <svg width="15" height="10" viewBox="0 0 15 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                      d="M14.256 0.244078C14.5814 0.569515 14.5814 1.09715 14.256 1.42259L5.92263 9.75592C5.59719 10.0814 5.06956 10.0814 4.74412 9.75592L0.577452 5.58926C0.252015 5.26382 0.252015 4.73618 0.577452 4.41074C0.902889 4.08531 1.43053 4.08531 1.75596 4.41074L5.33337 7.98816L13.0775 0.244078C13.4029 -0.0813592 13.9305 -0.0813592 14.256 0.244078Z"
                      fill="#46A758"
                    />
                  </svg>
                </div>
              )}
              {fields['slug']?.error ? (
                <label className="label tj-input-error">{fields['slug']?.error || ''}</label>
              ) : fields['slug'].value ? (
                <label className="label label-success">{`Slug accepted!`}</label>
              ) : (
                <label className="label label-info">{`URL-friendly 'slug' consists of lowercase letters, numbers, and hyphens`}</label>
              )}
            </div>
          </div>
          <div className="row mb-3">
            <div className="col modal-main tj-app-input">
              <label>Workspace link</label>
              <div className={`tj-text-input break-all ${darkMode ? 'dark' : ''}`}>
                {!slugProgress ? (
                  `${window.public_config?.TOOLJET_HOST}/${fields['slug']?.value || ''}`
                ) : (
                  <div className="d-flex gap-2">
                    <div class="spinner-border text-secondary workspace-spinner" role="status">
                      <span class="visually-hidden">Loading...</span>
                    </div>
                    {`Updating link`}
                  </div>
                )}
              </div>
              <label className="label label-success label-updated">
                {fields['slug'].value && !fields['slug'].error ? `Link updated successfully!` : ''}
              </label>
            </div>
          </div>
          <div>
            <div className="d-flex mb-3">
              <span data-cy={`label-hide-header-for-launched-apps`}>
                {t('leftSidebar.Settings.hideHeader', 'Hide header for launched apps')}
              </span>
              <div className="ms-auto form-check form-switch position-relative">
                <input
                  data-cy={`toggle-hide-header-for-launched-apps`}
                  className="form-check-input"
                  type="checkbox"
                  checked={hideHeader}
                  onChange={(e) => globalSettingsChanged('hideHeader', e.target.checked)}
                />
              </div>
            </div>
            <div className="d-flex mb-3">
              <span data-cy={`label-maintenance-mode`}>
                {t('leftSidebar.Settings.maintenanceMode', 'Maintenance mode')}
              </span>
              <div className="ms-auto form-check form-switch position-relative">
                <input
                  data-cy={`toggle-maintenance-mode`}
                  className="form-check-input"
                  type="checkbox"
                  checked={is_maintenance_on}
                  onChange={() => setConfirmationShow(true)}
                />
              </div>
            </div>
            <div className="d-flex mb-3">
              <span data-cy={`label-max-canvas-width`} className="w-full m-auto">
                {t('leftSidebar.Settings.maxWidthOfCanvas', 'Max width of canvas')}
              </span>
              <div className="position-relative">
                <div className="input-with-icon">
                  <input
                    data-cy="maximum-canvas-width-input-field"
                    type="text"
                    className={`form-control form-control-sm`}
                    placeholder={'0'}
                    onChange={(e) => {
                      const width = e.target.value;
                      if (!Number.isNaN(width) && width >= 0) globalSettingsChanged('canvasMaxWidth', width);
                    }}
                    value={canvasMaxWidth}
                  />
                  <select
                    data-cy={`dropdown-max-canvas-width-type`}
                    className="form-select"
                    aria-label="Select canvas width type"
                    onChange={(event) => {
                      const newCanvasMaxWidthType = event.currentTarget.value;
                      globalSettingsChanged('canvasMaxWidthType', newCanvasMaxWidthType);
                      if (newCanvasMaxWidthType === '%') {
                        globalSettingsChanged('canvasMaxWidth', 100);
                      } else if (newCanvasMaxWidthType === 'px') {
                        globalSettingsChanged('canvasMaxWidth', 1292);
                      }
                    }}
                  >
                    <option value="%" selected={canvasMaxWidthType === '%'}>
                      %
                    </option>
                    <option value="px" selected={canvasMaxWidthType === 'px' || _.isUndefined(canvasMaxWidthType)}>
                      px
                    </option>
                  </select>
                </div>
              </div>
            </div>
            {/* <div className="d-flex mb-3">
              <span className="w-full m-auto" data-cy={`label-max-canvas-height`}>
                {t('leftSidebar.Settings.maxHeightOfCanvas', 'Max height of canvas')}
              </span>
              <div className="position-relative">
                <div className="input-with-icon">
                  <input
                    data-cy="maximum-canvas-height-input-field"
                    type="text"
                    className={`form-control form-control-sm maximum-canvas-height-input-field`}
                    placeholder={'0'}
                    onChange={(e) => {
                      const height = e.target.value;
                      if (!Number.isNaN(height) && height <= 2400) globalSettingsChanged('canvasMaxHeight', height);
                    }}
                    value={canvasMaxHeight}
                  />
                  <span className="input-group-text">px</span>
                </div>
              </div>
            </div> */}
            <div className="d-flex align-items-center">
              <span className="w-full" data-cy={`label-bg-canvas`}>
                {t('leftSidebar.Settings.backgroundColorOfCanvas', 'Background color of canvas')}
              </span>
              <div className="canvas-codehinter-container">
                {showPicker && (
                  <div>
                    <div style={coverStyles} onClick={() => setShowPicker(false)} />
                    <SketchPicker
                      data-cy={`color-picker-canvas`}
                      className="canvas-background-picker"
                      onFocus={() => setShowPicker(true)}
                      color={canvasBackgroundColor}
                      onChangeComplete={(color) => {
                        globalSettingsChanged('canvasBackgroundColor', [color.hex, color.rgb]);
                        globalSettingsChanged('backgroundFxQuery', color.hex);
                      }}
                    />
                  </div>
                )}
                {forceCodeBox && (
                  <div
                    className="row mx-0 form-control form-control-sm canvas-background-holder"
                    onClick={() => setShowPicker(true)}
                  >
                    <div
                      data-cy={`canvas-bg-color-picker`}
                      className="col-auto"
                      style={{
                        float: 'right',
                        width: '20px',
                        height: '20px',
                        backgroundColor: canvasBackgroundColor,
                        border: `0.25px solid ${
                          ['#ffffff', '#fff', '#1f2936'].includes(canvasBackgroundColor) && '#c5c8c9'
                        }`,
                      }}
                    ></div>
                    <div className="col">{canvasBackgroundColor}</div>
                  </div>
                )}
                <div
                  className={`${!forceCodeBox && 'hinter-canvas-input'} ${!darkMode && 'hinter-canvas-input-light'} `}
                >
                  {!forceCodeBox && (
                    <CodeHinter
                      cyLabel={`canvas-bg-colour`}
                      currentState={realState}
                      initialValue={backgroundFxQuery ? backgroundFxQuery : canvasBackgroundColor}
                      value={backgroundFxQuery ? backgroundFxQuery : canvasBackgroundColor}
                      theme={darkMode ? 'monokai' : 'duotone-light'}
                      mode="javascript"
                      className="canvas-hinter-wrap"
                      lineNumbers={false}
                      onChange={(color) => {
                        globalSettingsChanged('canvasBackgroundColor', resolveReferences(color, realState));
                        globalSettingsChanged('backgroundFxQuery', color);
                      }}
                    />
                  )}
                  <div className={`fx-canvas ${!darkMode && 'fx-canvas-light'} `}>
                    <FxButton
                      dataCy={`canvas-bg-color`}
                      active={!forceCodeBox ? true : false}
                      onPress={() => {
                        setForceCodeBox(!forceCodeBox);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Confirm
        show={showConfirmation}
        message={
          is_maintenance_on
            ? 'Users will now be able to launch the released version of this app, do you wish to continue?'
            : 'Users will not be able to launch the app until maintenance mode is turned off, do you wish to continue?'
        }
        onConfirm={() => toggleAppMaintenance()}
        onCancel={() => setConfirmationShow(false)}
        darkMode={darkMode}
      />
      <Popover
        handleToggle={(show) => {
          if (show) setShow('settings');
          else {
            setShow('');
            setShowPicker(false);
          }
        }}
        popoverContentClassName="p-0 sidebar-h-100-popover global-settings-popover-content"
        side="bottom"
        popoverContent={popoverContent}
        popoverContentHeight="auto"
      >
        <LeftSidebarItem
          selectedSidebarItem={show}
          icon="settings"
          className={cx(`cursor-pointer sidebar-global-settings`)}
          tip="Settings"
        />
      </Popover>
    </>
  );
};

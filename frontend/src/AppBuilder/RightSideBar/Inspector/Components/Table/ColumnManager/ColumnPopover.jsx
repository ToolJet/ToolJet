import React, { useState } from 'react';
import Popover from 'react-bootstrap/Popover';
import { StylesTabElements } from './StylesTabElements';
import { PropertiesTabElements } from './PropertiesTabElements';

export const ColumnPopoverContent = ({
  column,
  index,
  darkMode,
  currentState,
  onColumnItemChange,
  getPopoverFieldSource,
  setColumnPopoverRootCloseBlocker,
  component,
  props,
  columnEventChanged,
  handleEventManagerPopoverCallback,
}) => {
  const [activeTab, setActiveTab] = useState('propertiesTab');

  const timeZoneOptions = [
    { name: 'UTC', value: 'Etc/UTC' },
    { name: '-12:00', value: 'Etc/GMT+12' },
    { name: '-11:00', value: 'Etc/GMT+11' },
    { name: '-10:00', value: 'Pacific/Honolulu' },
    { name: '-09:00', value: 'America/Anchorage' },
    { name: '-08:00', value: 'America/Santa_Isabel' },
    { name: '-07:00', value: 'America/Chihuahua' },
    { name: '-06:00', value: 'America/Guatemala' },
    { name: '-05:00', value: 'America/Bogota' },
    { name: '-04:00', value: 'America/Halifax' },
    { name: '-03:30', value: 'America/St_Johns' },
    { name: '-03:00', value: 'America/Sao_Paulo' },
    { name: '-02:00', value: 'Etc/GMT+2' },
    { name: '-01:00', value: 'Atlantic/Cape_Verde' },
    { name: '+00:00', value: 'UTC' },
    { name: '+01:00', value: 'Europe/Berlin' },
    { name: '+02:00', value: 'Africa/Gaborone' },
    { name: '+03:00', value: 'Asia/Baghdad' },
    { name: '+04:00', value: 'Asia/Muscat' },
    { name: '+04:30', value: 'Asia/Kabul' },
    { name: '+05:00', value: 'Asia/Tashkent' },
    { name: '+05:30', value: 'Asia/Colombo' },
    { name: '+05:45', value: 'Asia/Kathmandu' },
    { name: '+06:00', value: 'Asia/Almaty' },
    { name: '+06:30', value: 'Asia/Yangon' },
    { name: '+07:00', value: 'Asia/Bangkok' },
    { name: '+08:00', value: 'Asia/Makassar' },
    { name: '+09:00', value: 'Asia/Seoul' },
    { name: '+09:30', value: 'Australia/Darwin' },
    { name: '+10:00', value: 'Pacific/Chuuk' },
    { name: '+11:00', value: 'Pacific/Pohnpei' },
    { name: '+12:00', value: 'Etc/GMT-12' },
    { name: '+13:00', value: 'Pacific/Auckland' },
  ];

  return (
    <>
      <Popover.Header>
        <div className="d-flex custom-gap-4 align-self-stretch tj-text tj-text-xsm font-weight-500 text-secondary cursor-pointer">
          <div
            className={`${activeTab === 'propertiesTab' && 'active-column-tab'} column-header-tab`}
            onClick={() => {
              if (activeTab !== 'propertiesTab') setActiveTab('propertiesTab');
            }}
          >
            Properties
          </div>
          <div
            className={`${activeTab === 'stylesTab' && 'active-column-tab'} column-header-tab`}
            onClick={() => {
              if (activeTab !== 'stylesTab') setActiveTab('stylesTab');
            }}
          >
            Styles
          </div>
        </div>
      </Popover.Header>
      <Popover.Body
        className={`table-column-popover ${darkMode && 'theme-dark'}`}
        style={{ maxHeight: '80vh', overflowY: 'auto' }}
      >
        {activeTab === 'propertiesTab' ? (
          <PropertiesTabElements
            column={column}
            index={index}
            darkMode={darkMode}
            currentState={currentState}
            onColumnItemChange={onColumnItemChange}
            getPopoverFieldSource={getPopoverFieldSource}
            setColumnPopoverRootCloseBlocker={setColumnPopoverRootCloseBlocker}
            component={component}
            props={props}
            columnEventChanged={columnEventChanged}
            timeZoneOptions={timeZoneOptions}
            handleEventManagerPopoverCallback={handleEventManagerPopoverCallback}
          />
        ) : (
          <StylesTabElements
            column={column}
            index={index}
            darkMode={darkMode}
            currentState={currentState}
            onColumnItemChange={onColumnItemChange}
            getPopoverFieldSource={getPopoverFieldSource}
            component={component}
          />
        )}
      </Popover.Body>
    </>
  );
};

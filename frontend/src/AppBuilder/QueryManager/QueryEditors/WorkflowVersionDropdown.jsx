import React, { useState } from 'react';
import { ToolTip } from '@/_components/ToolTip';
import Warning from '@/_ui/Icon/solidIcons/Warning';
import { badgeStyle } from '@/_helpers/versionLabels';

// ponytail: copy of ModuleVersionDropdown's look (frontend/ee) minus Refresh/pull; merge into one shared component if both keep evolving
const CURRENT_BRANCH_TOOLTIP =
  'On merge, this resolves to the draft version of main in ToolJet. Save a version to pin.';

const fontFamily = 'IBM Plex Sans, sans-serif';

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.5 4.5L6.5 11.5L3 8"
      stroke="var(--text-accent, #3e63dd)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const OptionLabel = ({ option, showWarning, fontWeight = 500 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
    <span
      style={{
        fontSize: '12px',
        fontWeight,
        fontFamily,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        color: 'var(--text-default)',
      }}
    >
      {option.label}
    </span>
    {showWarning && (
      <ToolTip message={CURRENT_BRANCH_TOOLTIP} placement="top">
        <span style={{ display: 'inline-flex', alignItems: 'center', cursor: 'help' }}>
          <Warning fill="var(--text-warning)" width="14" />
        </span>
      </ToolTip>
    )}
    {option.badge && (
      <span className="tj-text-xsm" style={badgeStyle(option.badge.bg, option.badge.color)}>
        {option.badge.text}
      </span>
    )}
  </div>
);

const VersionItem = ({ option, isSelected, showWarning, onSelect }) => {
  const [isHovering, setIsHovering] = useState(false);
  return (
    <div
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={onSelect}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '6px',
        borderRadius: '6px',
        cursor: 'pointer',
        backgroundColor: isHovering ? 'var(--interactive-hover)' : 'transparent',
        gap: '8px',
      }}
    >
      <div
        style={{
          width: 16,
          height: 16,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isSelected && <CheckIcon />}
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '2px',
          minHeight: '38px',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        <OptionLabel option={option} showWarning={showWarning} />
        {option.description && (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 400,
              fontFamily,
              color: 'var(--text-placeholder)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {option.description}
          </span>
        )}
      </div>
    </div>
  );
};

export const WorkflowVersionDropdown = ({ options, value, onChange, isWarned, placeholder = 'Select version' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((o) => o.value === value);

  return (
    <div style={{ position: 'relative', width: '300px' }} data-cy="workflow-version-select">
      <div
        onClick={() => setIsOpen((v) => !v)}
        style={{
          height: '32px',
          border: '1px solid var(--border-default)',
          borderRadius: '6px',
          padding: '0 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          backgroundColor: 'var(--surfaces-surface-01)',
          fontSize: '12px',
          color: 'var(--text-default)',
        }}
      >
        {selectedOption ? (
          <OptionLabel option={selectedOption} showWarning={isWarned(selectedOption)} fontWeight={400} />
        ) : (
          <span style={{ color: 'var(--text-placeholder)' }}>{placeholder}</span>
        )}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, marginLeft: 4 }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {isOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setIsOpen(false)} />
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 1000,
              marginTop: 4,
              backgroundColor: 'var(--surfaces-surface-01)',
              border: '1px solid var(--border-weak)',
              borderRadius: '10px',
              boxShadow: '0px 0px 1px rgba(48, 50, 51, 0.05), 0px 8px 16px rgba(48, 50, 51, 0.1)',
              minWidth: 240,
              maxHeight: 320,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              paddingBottom: '8px',
            }}
          >
            <div style={{ padding: '12px 16px 2px', flexShrink: 0 }}>
              <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-default)', fontFamily }}>
                Versions
              </span>
            </div>
            <div style={{ height: 1, backgroundColor: 'var(--border-weak)', flexShrink: 0, margin: '8px 0 0' }} />
            <div
              style={{
                overflowY: 'auto',
                padding: '4px 8px 0',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              {options.length === 0 ? (
                <div style={{ padding: '8px', fontSize: '12px', color: 'var(--text-placeholder)' }}>
                  No versions available
                </div>
              ) : (
                options.map((option) => (
                  <VersionItem
                    key={option.value}
                    option={option}
                    isSelected={option.value === value}
                    showWarning={isWarned(option)}
                    onSelect={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                  />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

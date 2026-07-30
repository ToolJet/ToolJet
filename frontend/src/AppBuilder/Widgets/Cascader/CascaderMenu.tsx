import React, { useState, useMemo, useImperativeHandle, forwardRef, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import Loader from '@/ToolJetUI/Loader/Loader';
import type { CascaderMenuRef, CascaderNode, CascaderPathMaps, CascaderValue } from './types';
import { areCascaderValuesEqual, getCascaderValueKey, getNodesAtPath } from './utils';

const LoaderComponent = Loader as React.ComponentType<any>;

interface CascaderMenuProps {
  tree: CascaderNode[];
  maps: CascaderPathMaps;
  selectedValue: CascaderValue | null;
  optionsLoading: boolean;
  onSelectLeaf: (value: CascaderValue) => void;
  menuTextColor?: string;
  accentColor?: string;
}

const ROW_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  height: '32px',
  padding: '0 12px',
  borderRadius: '6px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  fontSize: '14px',
  lineHeight: '20px',
};

/**
 * Single-column drilldown menu for the Cascader.
 * Shows one level at a time with a back/breadcrumb header. Parent rows navigate
 * deeper; leaf rows select and close. Keyboard is driven imperatively from the
 * input (via ref) so browser focus stays on the input.
 */
const CascaderMenu = forwardRef<CascaderMenuRef, CascaderMenuProps>(
  ({ tree, maps, selectedValue, optionsLoading, onSelectLeaf, menuTextColor, accentColor }, ref) => {
    // Restore the drilldown to the selected leaf's parent level when reopening.
    const initialPath = useMemo(() => {
      if (selectedValue != null) {
        const valueKey = getCascaderValueKey(selectedValue);
        if (maps.valuePathObj[valueKey]) return maps.valuePathObj[valueKey].slice(0, -1);
      }
      return [];
    }, [selectedValue, maps]);

    const [activePath, setActivePath] = useState<CascaderValue[]>(() => initialPath);
    const currentNodes = useMemo(() => getNodesAtPath(tree, activePath), [tree, activePath]);

    const firstEnabledIndex = () => currentNodes.findIndex((n) => !n.disabled);
    const [highlightedIndex, setHighlightedIndex] = useState(() => {
      if (selectedValue != null) {
        const idx = currentNodes.findIndex((n) => areCascaderValuesEqual(n.value, selectedValue));
        if (idx >= 0) return idx;
      }
      return firstEnabledIndex();
    });

    // Reset highlight when the level's nodes or the selection change, so the
    // highlighted index never goes stale/out-of-range if the option tree
    // updates (dynamic options / visibility toggles) while the path is unchanged.
    useEffect(() => {
      const selIdx =
        selectedValue != null ? currentNodes.findIndex((n) => areCascaderValuesEqual(n.value, selectedValue)) : -1;
      setHighlightedIndex(selIdx >= 0 ? selIdx : currentNodes.findIndex((n) => !n.disabled));
    }, [currentNodes, selectedValue]);

    const breadcrumb = activePath.map((v) => maps.valueToNode[getCascaderValueKey(v)]?.label).filter(Boolean);

    const descend = (node: CascaderNode) => {
      if (node.disabled || !node.children) return;
      setActivePath((prev) => [...prev, node.value]);
    };

    const goBack = () => setActivePath((prev) => prev.slice(0, -1));

    const activateRow = (node?: CascaderNode) => {
      if (!node || node.disabled) return;
      if (node.children) descend(node);
      else onSelectLeaf(node.value);
    };

    const moveHighlight = (dir: number) => {
      if (currentNodes.length === 0) return;
      let i = highlightedIndex;
      for (let step = 0; step < currentNodes.length; step++) {
        i = (i + dir + currentNodes.length) % currentNodes.length;
        if (!currentNodes[i].disabled) {
          setHighlightedIndex(i);
          return;
        }
      }
    };

    // Imperative keyboard handler called from the input's onKeyDown.
    useImperativeHandle(ref, () => ({
      handleKeyDown: (e) => {
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            moveHighlight(1);
            return true;
          case 'ArrowUp':
            e.preventDefault();
            moveHighlight(-1);
            return true;
          case 'ArrowRight': {
            const node = currentNodes[highlightedIndex];
            if (node && node.children && !node.disabled) {
              e.preventDefault();
              descend(node);
              return true;
            }
            return false;
          }
          case 'ArrowLeft':
            if (activePath.length > 0) {
              e.preventDefault();
              goBack();
              return true;
            }
            return false;
          case 'Enter':
            if (currentNodes[highlightedIndex]) {
              e.preventDefault();
              activateRow(currentNodes[highlightedIndex]);
              return true;
            }
            return false;
          default:
            return false;
        }
      },
    }));

    return (
      <div className="cascader-menu" style={{ display: 'flex', flexDirection: 'column' }}>
        {!optionsLoading && breadcrumb.length > 0 && (
          <div
            className="cascader-menu-header"
            onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => e.preventDefault()}
            onClick={goBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              height: '36px',
              padding: '0 10px',
              cursor: 'pointer',
              color: 'var(--cc-primary-text)',
              fontSize: '14px',
              lineHeight: '20px',
              borderBottom: '1px solid var(--cc-weak-border, #e4e7eb)',
              flexShrink: 0,
            }}
            data-cy="cascader-menu-back"
          >
            <ChevronLeft size={14} style={{ flexShrink: 0 }} />
            <span
              style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              title={breadcrumb.join(' / ')}
            >
              {breadcrumb.join(' / ')}
            </span>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            // Gap keeps adjacent hover/selected row backgrounds from touching.
            gap: '2px',
            padding: '8px',
            maxHeight: '260px',
            overflowY: 'auto',
          }}
        >
          {optionsLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80px' }}>
              <LoaderComponent width="18" />
            </div>
          ) : currentNodes.length === 0 ? (
            <div
              style={{
                padding: '12px 8px',
                color: 'var(--cc-placeholder-text)',
                fontSize: '14px',
                textAlign: 'center',
              }}
              data-cy="cascader-no-options"
            >
              No options
            </div>
          ) : (
            currentNodes.map((node, index) => {
              const isParent = !!node.children;
              const isSelected = !isParent && selectedValue != null && areCascaderValuesEqual(node.value, selectedValue);
              const isHighlighted = index === highlightedIndex && !node.disabled;
              return (
                <div
                  key={`${getCascaderValueKey(node.value)}-${index}`}
                  // preventDefault keeps browser focus on the input (so onBlur doesn't fire on click)
                  onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => e.preventDefault()}
                  onMouseEnter={() => !node.disabled && setHighlightedIndex(index)}
                  onClick={() => activateRow(node)}
                  data-cy={`cascader-option-${String(node.value)}`}
                  style={{
                    ...ROW_STYLE,
                    color: node.disabled ? 'var(--text-disabled)' : menuTextColor || 'var(--cc-primary-text)',
                    opacity: node.disabled ? 0.4 : 1,
                    cursor: node.disabled ? 'not-allowed' : 'pointer',
                    backgroundColor: isHighlighted
                      ? 'var(--interactive-overlays-fill-hover)'
                      : isSelected
                      ? 'var(--cc-primary-accent-subtle, rgba(67,104,227,0.1))'
                      : 'transparent',
                  }}
                >
                  {/* Reserve the left gutter for every row (parent + leaf) so all
                      labels align in a single column; the check only renders for the
                      selected leaf. */}
                  <span style={{ width: '16px', display: 'inline-flex', flexShrink: 0 }}>
                    {isSelected && <Check size={16} color={accentColor || 'var(--cc-primary-brand)'} />}
                  </span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }} title={node.label}>
                    {node.label}
                  </span>
                  {isParent && <ChevronRight size={16} color="var(--cc-default-icon)" style={{ flexShrink: 0 }} />}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }
);

export default CascaderMenu;

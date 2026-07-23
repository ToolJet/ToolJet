import React, { useMemo, useState } from 'react';
import cx from 'classnames';
import { shallow } from 'zustand/shallow';
import useStore from '@/AppBuilder/_stores/store';
import TablerIcon from '@/_ui/Icon/TablerIcon';
import WidgetIcon from '@/../assets/images/icons/widgets';
import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Checkbox,
  Button,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/Rocket';

// Lists components hidden on mobile and lets the user re-enable the selected ones in one action.
export default function ManageMobileVisibilityDialog({ open, onClose, moduleId = 'canvas', darkMode }) {
  const currentPageComponents = useStore((state) => state.getCurrentPageComponents(moduleId), shallow);
  const setComponentProperty = useStore((state) => state.setComponentProperty, shallow);
  const getResolvedValue = useStore((state) => state.getResolvedValue, shallow);
  const clearTemporaryLayouts = useStore((state) => state.clearTemporaryLayouts, shallow);

  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selected, setSelected] = useState(() => new Set());

  const hiddenComponents = useMemo(
    () =>
      Object.entries(currentPageComponents)
        .filter(([, comp]) => !getResolvedValue(comp?.component?.definition?.others?.showOnMobile?.value))
        .map(([id, comp]) => ({ id, name: comp?.component?.name ?? id, type: comp?.component?.component ?? '' })),
    [currentPageComponents, getResolvedValue]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? hiddenComponents.filter((c) => c.name.toLowerCase().includes(q)) : hiddenComponents;
  }, [hiddenComponents, search]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((c) => selected.has(c.id));

  const toggleOne = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) filtered.forEach((c) => next.delete(c.id));
      else filtered.forEach((c) => next.add(c.id));
      return next;
    });

  const handleClose = () => {
    setSearch('');
    setSearchOpen(false);
    setSelected(new Set());
    onClose();
  };

  const handleUpdate = () => {
    selected.forEach((id) =>
      setComponentProperty(id, 'showOnMobile', true, 'others', 'value', false, moduleId, { saveAfterAction: true })
    );
    // Force a fresh mobile re-measure (as a layout switch does) so dynamic-height components size the
    // canvas correctly; without it the canvas keeps its stale desktop-derived height.
    clearTemporaryLayouts();
    handleClose();
  };

  const cellClass = '!tw-rounded-none tw-h-10 tw-py-0';
  const rowClass =
    'hover:tw-bg-transparent [&>td]:tw-border-solid [&>td]:tw-border-0 [&>td]:tw-border-b [&>td]:tw-border-border-weak [&:last-child>td]:tw-border-b-0';

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent
        className={cx('tw-max-w-[540px] tw-w-full', { 'dark-theme theme-dark': darkMode })}
        data-cy="manage-mobile-visibility-dialog"
      >
        <DialogHeader className="!tw-px-4">
          <div className="tw-flex tw-items-center tw-gap-2">
            <DialogTitle>Manage component visibility on mobile</DialogTitle>
          </div>
        </DialogHeader>
        {/* search icon, left of the auto-rendered close button */}
        <Button
          variant="ghost"
          iconOnly
          size="small"
          className="tw-absolute tw-right-10 tw-top-4"
          onClick={() => setSearchOpen((v) => !v)}
          aria-label="Search"
          data-cy="manage-mobile-visibility-search-toggle"
        >
          <TablerIcon iconName="IconSearch" size={16} />
        </Button>
        <DialogBody noPadding className="tw-flex tw-flex-col tw-flex-none tw-h-[444px]">
          {searchOpen && (
            <div className="tw-px-4 tw-py-3 tw-border-solid tw-border-0 tw-border-b tw-border-border-weak">
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <TablerIcon iconName="IconSearch" size={16} />
                </InputGroupAddon>
                <InputGroupInput
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search"
                  data-cy="manage-mobile-visibility-search"
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    onClick={() => {
                      setSearch('');
                      setSearchOpen(false);
                    }}
                    aria-label="Close search"
                  >
                    <TablerIcon iconName="IconX" size={14} />
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </div>
          )}
          <div className="tw-flex-1 tw-overflow-auto tw-bg-background-surface-layer-01">
            <Table className="tw-table-fixed tw-w-full">
              <TableHeader>
                <TableRow className="hover:tw-bg-transparent">
                  <TableHead className="tw-w-[52%] tw-pl-4 tw-pr-0 tw-text-[11px]">Component name</TableHead>
                  <TableHead className="tw-w-[28.6%] tw-px-2 tw-text-[11px]">Type</TableHead>
                  <TableHead className="tw-w-[13%] tw-pl-0 !tw-pr-4 tw-text-[11px]">
                    <span className="tw-flex tw-items-center tw-justify-end tw-gap-3 tw-whitespace-nowrap">
                      Visibility
                      <Checkbox checked={allFilteredSelected} onCheckedChange={toggleAll} aria-label="Select all" />
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id} className={rowClass} data-cy={`manage-mobile-row-${c.id}`}>
                    <TableCell className={`${cellClass} tw-pl-4 tw-pr-0 tw-truncate`}>{c.name}</TableCell>
                    <TableCell className={`${cellClass} tw-px-2 tw-text-text-placeholder`}>
                      <span className="tw-flex tw-items-center tw-gap-2 tw-truncate [&_svg]:tw-w-5 [&_svg]:tw-h-5">
                        <WidgetIcon
                          name={componentTypeDefinitionMap[c.type]?.name?.toLowerCase()}
                          version={componentTypeDefinitionMap[c.type]?.version}
                        />
                        {componentTypeDefinitionMap[c.type]?.displayName ?? c.type}
                      </span>
                    </TableCell>
                    <TableCell className={`${cellClass} tw-pl-0 !tw-pr-4`}>
                      <div className="tw-flex tw-justify-end">
                        <Checkbox
                          checked={selected.has(c.id)}
                          onCheckedChange={() => toggleOne(c.id)}
                          aria-label={`Show ${c.name} on mobile`}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filtered.length === 0 && (
              <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-2 tw-py-10 tw-text-text-placeholder">
                <TablerIcon iconName="IconFile" size={20} />
                <span className="tw-text-xs">No results matching the search</span>
              </div>
            )}
          </div>
        </DialogBody>
        <DialogFooter className="tw-border-border-weak">
          <Button variant="outline" onClick={handleClose} data-cy="manage-mobile-visibility-close">
            Close
          </Button>
          <Button
            variant="primary"
            onClick={handleUpdate}
            disabled={selected.size === 0}
            data-cy="manage-mobile-visibility-update"
          >
            <TablerIcon iconName="IconEye" size={16} />
            Update visibility
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

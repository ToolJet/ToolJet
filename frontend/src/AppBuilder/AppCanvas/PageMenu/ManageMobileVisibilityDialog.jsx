import React, { useMemo, useState } from 'react';
import { shallow } from 'zustand/shallow';
import useStore from '@/AppBuilder/_stores/store';
import TablerIcon from '@/_ui/Icon/TablerIcon';
import { getSvgIcon } from '@/_helpers/appUtils';
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
  Input,
  Button,
} from '@/components/ui/Rocket';

// Lists components hidden on mobile and lets the user re-enable the selected ones in one action.
export default function ManageMobileVisibilityDialog({ open, onClose, moduleId = 'canvas' }) {
  const currentPageComponents = useStore((state) => state.getCurrentPageComponents(moduleId), shallow);
  const setComponentProperty = useStore((state) => state.setComponentProperty, shallow);
  const getResolvedValue = useStore((state) => state.getResolvedValue, shallow);

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
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent className="tw-max-w-[540px] tw-w-full" data-cy="manage-mobile-visibility-dialog">
        <DialogHeader>
          <div className="tw-flex tw-items-center tw-gap-2">
            <TablerIcon iconName="IconGripVertical" size={16} className="tw-text-text-placeholder" />
            <DialogTitle>Manage component visibility</DialogTitle>
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
        <DialogBody className="tw-flex tw-flex-col tw-gap-3">
          {searchOpen && (
            <Input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              data-cy="manage-mobile-visibility-search"
            />
          )}
          <div className="tw-max-h-[320px] tw-overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Component name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>
                    <span className="tw-flex tw-items-center tw-justify-end tw-gap-3 tw-whitespace-nowrap tw-pr-2">
                      Visibility
                      <Checkbox checked={allFilteredSelected} onCheckedChange={toggleAll} aria-label="Select all" />
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id} data-cy={`manage-mobile-row-${c.id}`}>
                    <TableCell>{c.name}</TableCell>
                    <TableCell className="tw-text-text-placeholder">
                      <span className="tw-flex tw-items-center tw-gap-2">
                        {getSvgIcon(c.type, 16, 16)}
                        {componentTypeDefinitionMap[c.type]?.displayName ?? c.type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="tw-flex tw-justify-end tw-pr-2">
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
        <DialogFooter>
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

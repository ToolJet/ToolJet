import React from 'react';
import usePopover from './use-popover';

const usePinnedPopover = (defaultOption = false) => {
    const [open, trigger, content, setOpen] = usePopover(defaultOption)
    const [popoverPinned, setPopoverPinned] = React.useState(defaultOption)
  
    const updatePopoverPinnedState = () => {
      setPopoverPinned((prev) => !prev)
    }
  
    React.useEffect(() => {
      if(popoverPinned) {
        setOpen(true)
      }
    },[popoverPinned])

    return [open, trigger, content, popoverPinned, updatePopoverPinnedState]
}

export default usePinnedPopover;
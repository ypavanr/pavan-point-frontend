"use client";

import { useEffect } from 'react';

// Shared by every toolbar popover (ColorMenu, LinkMenu): closes on an outside
// click, and closes on Escape without letting the keydown bubble up to the
// note editor's own Escape handler - otherwise Escape while a popover is
// open closes the whole note instead of just dismissing the popover.
export default function useDismissablePopover(ref, open, onClose) {
    useEffect(() => {
        if (!open) return undefined;

        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) onClose();
        };
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown, true);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [open, ref, onClose]);
}

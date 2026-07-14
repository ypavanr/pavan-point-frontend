"use client";

import { useRef, useState } from 'react';
import { Ban } from 'lucide-react';
import ToolbarButton from './ToolbarButton';
import useDismissablePopover from './useDismissablePopover';

// Generic color-swatch popover, shared by the highlight (background) and
// text-color toolbar buttons so the two don't duplicate the same
// open/close/click-outside dropdown logic.
export default function ColorMenu({ icon: Icon, title, colors, isActive, onPick, onClear }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useDismissablePopover(ref, open, () => setOpen(false));

    return (
        <div className="relative" ref={ref}>
            <ToolbarButton onClick={() => setOpen((o) => !o)} isActive={isActive} title={title}>
                <Icon size={18} />
            </ToolbarButton>
            {open && (
                <div className="absolute top-10 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex items-center gap-1.5 z-20">
                    {colors.map((c) => (
                        <button
                            key={c.value}
                            type="button"
                            title={c.name}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => { onPick(c.value); setOpen(false); }}
                            className="w-6 h-6 rounded-full border border-gray-300 hover:scale-110 transition"
                            style={{ backgroundColor: c.value }}
                        />
                    ))}
                    <button
                        type="button"
                        title={`Remove ${title.toLowerCase()}`}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => { onClear(); setOpen(false); }}
                        className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 hover:bg-gray-50"
                    >
                        <Ban size={14} />
                    </button>
                </div>
            )}
        </div>
    );
}

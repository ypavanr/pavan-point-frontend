"use client";

import { useEffect, useRef, useState } from 'react';
import { Link as LinkIcon, Trash2 } from 'lucide-react';
import ToolbarButton from './ToolbarButton';
import useDismissablePopover from './useDismissablePopover';
import { normalizeLinkUrl } from '@/lib/noteEditorExtensions';

export default function LinkMenu({ editor }) {
    const [open, setOpen] = useState(false);
    const [url, setUrl] = useState('');
    const [error, setError] = useState('');
    const ref = useRef(null);
    const inputRef = useRef(null);

    const isActive = editor.isActive('link');

    useDismissablePopover(ref, open, () => setOpen(false));

    useEffect(() => {
        if (!open) return undefined;
        setUrl(editor.getAttributes('link').href || '');
        setError('');
        setTimeout(() => inputRef.current?.focus(), 0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const applyLink = () => {
        const normalized = normalizeLinkUrl(url);
        if (!normalized) {
            setError('Enter a valid http(s) or mailto link');
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: normalized }).run();
        setOpen(false);
    };

    const removeLink = () => {
        editor.chain().focus().unsetLink().run();
        setOpen(false);
    };

    return (
        <div className="relative" ref={ref}>
            <ToolbarButton onClick={() => setOpen((o) => !o)} isActive={isActive} title="Link">
                <LinkIcon size={18} />
            </ToolbarButton>
            {open && (
                <div className="absolute top-10 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-72 z-20">
                    <form
                        onSubmit={(e) => { e.preventDefault(); applyLink(); }}
                        className="flex items-center gap-2"
                    >
                        <input
                            ref={inputRef}
                            value={url}
                            onChange={(e) => { setUrl(e.target.value); setError(''); }}
                            placeholder="https://example.com"
                            className="flex-1 min-w-0 px-2 py-1.5 text-sm border border-gray-300 rounded-md outline-none focus:border-blue-400"
                        />
                        {isActive && (
                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={removeLink}
                                title="Remove link"
                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                        <button
                            type="submit"
                            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition"
                        >
                            Apply
                        </button>
                    </form>
                    {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
                </div>
            )}
        </div>
    );
}

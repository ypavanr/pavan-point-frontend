"use client";

import { useState, useRef, useEffect } from 'react';
import {
    Undo2, Redo2, Heading1, Heading2, Heading3,
    Bold, Italic, Underline as UnderlineIcon, Strikethrough,
    Highlighter, Ban,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    List, ListOrdered
} from 'lucide-react';
import clsx from 'clsx';

const HIGHLIGHT_COLORS = [
    { name: 'Yellow', value: '#fef08a' },
    { name: 'Green', value: '#bbf7d0' },
    { name: 'Blue', value: '#bfdbfe' },
    { name: 'Pink', value: '#fbcfe8' },
];

export function ToolbarButton({ onClick, isActive, disabled, title, children }) {
    return (
        <button
            type="button"
            onMouseDown={(e) => e.preventDefault()} // don't steal focus/selection from the editor
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={clsx(
                "p-2 rounded-md hover:bg-gray-100 transition disabled:opacity-30 disabled:hover:bg-transparent",
                isActive ? "bg-blue-100 text-blue-700" : "text-gray-600"
            )}
        >
            {children}
        </button>
    );
}

export function HighlightMenu({ editor }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    return (
        <div className="relative" ref={ref}>
            <ToolbarButton onClick={() => setOpen((o) => !o)} isActive={editor.isActive('highlight')} title="Highlight">
                <Highlighter size={18} />
            </ToolbarButton>
            {open && (
                <div className="absolute top-10 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex items-center gap-1.5 z-10">
                    {HIGHLIGHT_COLORS.map((c) => (
                        <button
                            key={c.value}
                            type="button"
                            title={c.name}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => { editor.chain().focus().toggleHighlight({ color: c.value }).run(); setOpen(false); }}
                            className="w-6 h-6 rounded-full border border-gray-300 hover:scale-110 transition"
                            style={{ backgroundColor: c.value }}
                        />
                    ))}
                    <button
                        type="button"
                        title="Remove highlight"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => { editor.chain().focus().unsetHighlight().run(); setOpen(false); }}
                        className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 hover:bg-gray-50"
                    >
                        <Ban size={14} />
                    </button>
                </div>
            )}
        </div>
    );
}

export function Divider() {
    return <div className="w-px h-6 bg-gray-200 mx-1 flex-shrink-0" />;
}

export default function NoteToolbar({ editor }) {
    if (!editor) return null;

    return (
        <div className="flex flex-wrap items-center gap-0.5 px-3 md:px-6 py-2 border-b border-gray-200 bg-gray-50 flex-shrink-0">
            <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
                <Undo2 size={18} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
                <Redo2 size={18} />
            </ToolbarButton>
            <Divider />
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="Heading 1">
                <Heading1 size={18} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="Heading 2">
                <Heading2 size={18} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} title="Heading 3">
                <Heading3 size={18} />
            </ToolbarButton>
            <Divider />
            <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold">
                <Bold size={18} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic">
                <Italic size={18} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline">
                <UnderlineIcon size={18} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Strikethrough">
                <Strikethrough size={18} />
            </ToolbarButton>
            <HighlightMenu editor={editor} />
            <Divider />
            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="Align left">
                <AlignLeft size={18} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="Align center">
                <AlignCenter size={18} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="Align right">
                <AlignRight size={18} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} isActive={editor.isActive({ textAlign: 'justify' })} title="Justify">
                <AlignJustify size={18} />
            </ToolbarButton>
            <Divider />
            <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullet list">
                <List size={18} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Numbered list">
                <ListOrdered size={18} />
            </ToolbarButton>
        </div>
    );
}

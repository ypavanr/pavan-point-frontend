"use client";

import { PARAGRAPH_STYLES, applyParagraphStyle, getActiveParagraphStyle } from '@/lib/noteEditorExtensions';

export default function ParagraphStyleSelect({ editor }) {
    const current = getActiveParagraphStyle(editor);

    return (
        <select
            value={current}
            onChange={(e) => applyParagraphStyle(editor, e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            title="Paragraph style"
            className="h-9 px-2 rounded-md border border-transparent hover:bg-gray-100 text-sm text-gray-700 bg-transparent outline-none cursor-pointer flex-shrink-0"
        >
            {PARAGRAPH_STYLES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
            ))}
        </select>
    );
}

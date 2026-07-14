import StarterKit from '@tiptap/starter-kit';
import { TextStyle, Color } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';

// Single source of truth for the Tiptap schema, shared by every place that
// creates an editor instance (edit mode and read-only rendering use the same
// extension set, so a document always parses identically in both).
//
// Keep this in sync with the backend allow-list in
// backend/app/notes_validation.py - that file is the real security boundary,
// this one just has to produce documents the backend will accept.
//
// StarterKit (Tiptap v3) already bundles Bold/Italic/Strike/Underline/
// Paragraph/Heading/BulletList/OrderedList/ListItem/HardBreak/History/Link -
// registering any of those again as a separate extension creates a duplicate
// mark/node name, which silently corrupts the schema (symptom: formatting
// marks stop combining or toggling off correctly). Blockquote, code,
// codeBlock, and horizontalRule are disabled outright since nothing in the
// toolbar exposes them and the backend doesn't allow them. Link is disabled
// here and re-added below with a strict protocol allow-list.
export function createNoteExtensions({ editable, placeholder = 'Start writing…' } = {}) {
    return [
        StarterKit.configure({
            blockquote: false,
            code: false,
            codeBlock: false,
            horizontalRule: false,
            link: false,
            heading: { levels: [1, 2, 3] },
        }),
        TextStyle,
        Color,
        Highlight.configure({ multicolor: true }),
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        Link.configure({
            autolink: true,
            linkOnPaste: true,
            openOnClick: !editable,
            protocols: ['http', 'https', 'mailto'],
            HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank', class: 'note-link' },
        }),
        TaskList,
        TaskItem.configure({ nested: true }),
        Placeholder.configure({ placeholder }),
    ];
}

export const EMPTY_DOC = { type: 'doc', content: [{ type: 'paragraph' }] };

export const HIGHLIGHT_COLORS = [
    { name: 'Yellow', value: '#fef08a' },
    { name: 'Green', value: '#bbf7d0' },
    { name: 'Blue', value: '#bfdbfe' },
    { name: 'Pink', value: '#fbcfe8' },
    { name: 'Orange', value: '#fed7aa' },
];

export const TEXT_COLORS = [
    { name: 'Black', value: '#1f2937' },
    { name: 'Red', value: '#dc2626' },
    { name: 'Orange', value: '#ea580c' },
    { name: 'Green', value: '#16a34a' },
    { name: 'Blue', value: '#2563eb' },
    { name: 'Purple', value: '#9333ea' },
];

export const PARAGRAPH_STYLES = [
    { value: 'paragraph', label: 'Normal text' },
    { value: 'h1', label: 'Heading 1' },
    { value: 'h2', label: 'Heading 2' },
    { value: 'h3', label: 'Heading 3' },
];

export function getActiveParagraphStyle(editor) {
    if (editor.isActive('heading', { level: 1 })) return 'h1';
    if (editor.isActive('heading', { level: 2 })) return 'h2';
    if (editor.isActive('heading', { level: 3 })) return 'h3';
    return 'paragraph';
}

export function applyParagraphStyle(editor, style) {
    const chain = editor.chain().focus();
    if (style === 'paragraph') {
        chain.setParagraph().run();
    } else {
        chain.setHeading({ level: Number(style.slice(1)) }).run();
    }
}

// Client-side convenience only (nicer error message before the round-trip) -
// the backend independently rejects anything outside http(s)/mailto.
const ALLOWED_LINK_PROTOCOLS = ['http:', 'https:', 'mailto:'];

export function normalizeLinkUrl(raw) {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const withProtocol = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
        const url = new URL(withProtocol);
        if (!ALLOWED_LINK_PROTOCOLS.includes(url.protocol)) return null;
        return url.toString();
    } catch {
        return null;
    }
}

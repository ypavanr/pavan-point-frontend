"use client";

import {
    Undo2, Redo2,
    Bold, Italic, Underline as UnderlineIcon, Strikethrough,
    Highlighter, Baseline,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    List, ListOrdered, ListTodo,
} from 'lucide-react';
import ToolbarButton from './notes/ToolbarButton';
import ColorMenu from './notes/ColorMenu';
import LinkMenu from './notes/LinkMenu';
import Divider from './notes/Divider';
import ParagraphStyleSelect from './notes/ParagraphStyleSelect';
import { HIGHLIGHT_COLORS, TEXT_COLORS } from '@/lib/noteEditorExtensions';

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
            <ParagraphStyleSelect editor={editor} />
            <Divider />
            <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold (Ctrl+B)">
                <Bold size={18} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic (Ctrl+I)">
                <Italic size={18} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline (Ctrl+U)">
                <UnderlineIcon size={18} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Strikethrough">
                <Strikethrough size={18} />
            </ToolbarButton>
            <ColorMenu
                icon={Baseline}
                title="Text color"
                colors={TEXT_COLORS}
                isActive={editor.isActive('textStyle') && !!editor.getAttributes('textStyle').color}
                onPick={(color) => editor.chain().focus().setColor(color).run()}
                onClear={() => editor.chain().focus().unsetColor().run()}
            />
            <ColorMenu
                icon={Highlighter}
                title="Highlight"
                colors={HIGHLIGHT_COLORS}
                isActive={editor.isActive('highlight')}
                onPick={(color) => editor.chain().focus().toggleHighlight({ color }).run()}
                onClear={() => editor.chain().focus().unsetHighlight().run()}
            />
            <LinkMenu editor={editor} />
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
            <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive('taskList')} title="Checklist">
                <ListTodo size={18} />
            </ToolbarButton>
        </div>
    );
}

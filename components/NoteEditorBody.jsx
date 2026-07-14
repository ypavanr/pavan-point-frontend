"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { X, Download, Save, FileText } from 'lucide-react';
import clsx from 'clsx';
import api from '@/lib/api';
import NoteToolbar from './NoteToolbar';
import { createNoteExtensions, EMPTY_DOC } from '@/lib/noteEditorExtensions';
import { exportNoteAsPdf } from '@/lib/notePdfExport';

const AUTOSAVE_DELAY_MS = 1500;

function SaveIndicator({ saveState }) {
    const label = {
        saving: 'Saving…',
        saved: 'Saved',
        unsaved: 'Unsaved changes',
        error: 'Failed to save',
    }[saveState];
    return (
        <span className={clsx("text-xs select-none whitespace-nowrap", saveState === 'error' ? "text-red-500" : "text-gray-400")}>
            {label}
        </span>
    );
}

export default function NoteEditorBody({ note, isMaster, onClose, onSaved }) {
    const [title, setTitle] = useState(note.title);
    const [saveState, setSaveState] = useState('saved');
    const [isExporting, setIsExporting] = useState(false);
    const dirtyRef = useRef(false);
    const saveTimerRef = useRef(null);
    const latestRef = useRef({ title: note.title, contentJson: note.content_json });

    const editor = useEditor({
        extensions: createNoteExtensions({ editable: isMaster }),
        content: note.content_json || EMPTY_DOC,
        editable: isMaster,
        immediatelyRender: false,
        onUpdate: ({ editor: ed }) => {
            latestRef.current.contentJson = ed.getJSON();
            scheduleSave();
        },
    }, []);

    const performSave = useCallback(async () => {
        if (!isMaster || !dirtyRef.current) return;
        setSaveState('saving');
        try {
            const res = await api.patch(`/api/notes/${note.id}`, {
                title: latestRef.current.title,
                content_json: latestRef.current.contentJson,
            });
            dirtyRef.current = false;
            setSaveState('saved');
            onSaved?.(res.data);
        } catch {
            setSaveState('error');
        }
    }, [note.id, isMaster, onSaved]);

    const scheduleSave = useCallback(() => {
        if (!isMaster) return;
        dirtyRef.current = true;
        setSaveState('unsaved');
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(performSave, AUTOSAVE_DELAY_MS);
    }, [isMaster, performSave]);

    useEffect(() => () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); }, []);

    const handleTitleChange = (e) => {
        setTitle(e.target.value);
        latestRef.current.title = e.target.value;
        scheduleSave();
    };

    const handleManualSave = () => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        performSave();
    };

    const handleClose = useCallback(async () => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        if (isMaster && dirtyRef.current) await performSave();
        onClose();
    }, [isMaster, performSave, onClose]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') handleClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleClose]);

    const handleDownloadPdf = async () => {
        if (!editor || isExporting) return;
        setIsExporting(true);
        try {
            await exportNoteAsPdf({ title, contentJson: editor.getJSON(), filename: title });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-100">
            <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-gray-300 bg-white flex-shrink-0 z-10">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <FileText size={22} className="text-amber-500 flex-shrink-0" />
                    {isMaster ? (
                        <input
                            value={title}
                            onChange={handleTitleChange}
                            placeholder="Untitled Document"
                            className="text-lg font-medium text-gray-800 flex-1 min-w-0 outline-none border-b border-transparent focus:border-blue-400 truncate"
                        />
                    ) : (
                        <h2 className="text-lg font-medium text-gray-800 truncate">{title || 'Untitled Document'}</h2>
                    )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-3">
                    {isMaster && <SaveIndicator saveState={saveState} />}
                    {isMaster && (
                        <button onClick={handleManualSave} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition" title="Save now">
                            <Save size={20} />
                        </button>
                    )}
                    <button onClick={handleDownloadPdf} disabled={isExporting} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition disabled:opacity-40" title="Download as PDF">
                        <Download size={20} />
                    </button>
                    <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition" title="Close">
                        <X size={20} />
                    </button>
                </div>
            </div>

            {isMaster && <NoteToolbar editor={editor} />}

            <div className="flex-1 overflow-y-auto px-2 md:px-6 py-8 cursor-text relative" onClick={() => editor?.commands.focus()}>
                <EditorContent editor={editor} className="tiptap-content" />
            </div>
        </div>
    );
}

"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import NoteEditorBody from './NoteEditorBody';

export default function NoteEditorModal({ noteId, isMaster, onClose, onSaved }) {
    const [note, setNote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!noteId) return undefined;
        let cancelled = false;
        setNote(null);
        setLoading(true);
        setError(null);
        api.get(`/api/notes/${noteId}`)
            .then((res) => { if (!cancelled) setNote(res.data); })
            .catch(() => { if (!cancelled) setError('Failed to load note'); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [noteId]);

    if (!noteId) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-0 md:p-8" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gray-100 w-full h-full md:rounded-xl md:max-w-4xl md:h-[90vh] flex flex-col overflow-hidden shadow-2xl">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center text-gray-400 bg-white">Loading note...</div>
                ) : error ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-4 bg-white">
                        <p>{error}</p>
                        <button onClick={onClose} className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md">Close</button>
                    </div>
                ) : (
                    <NoteEditorBody key={note.id} note={note} isMaster={isMaster} onClose={onClose} onSaved={onSaved} />
                )}
            </div>
        </div>
    );
}

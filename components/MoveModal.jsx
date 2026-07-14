import { useEffect, useState, useCallback } from 'react';
import { Folder, ChevronRight, X } from 'lucide-react';
import api from '@/lib/api';

export default function MoveModal({ isOpen, item, onClose, onMove }) {
    const [browseFolderId, setBrowseFolderId] = useState('root');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchContents = useCallback(async (folderId) => {
        setLoading(true);
        try {
            const res = await api.get(`/api/folders/${folderId}`);
            setData(res.data);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            setBrowseFolderId('root');
            fetchContents('root');
        }
    }, [isOpen, fetchContents]);

    useEffect(() => {
        if (isOpen) fetchContents(browseFolderId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [browseFolderId]);

    if (!isOpen || !item) return null;

    const itemName = item.isFolder ? item.name : item.original_filename;
    // Can't move a folder into itself or any of its own subfolders.
    const isDisabledTarget = item.isFolder && (browseFolderId === item.id || data?.breadcrumbs?.some((b) => b.id === item.id));

    const subfolders = (data?.subfolders || []).filter((f) => !(item.isFolder && f.id === item.id));

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-[420px] max-h-[70vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-medium truncate">Move &quot;{itemName}&quot;</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex items-center flex-wrap gap-1 px-6 py-2 text-sm text-gray-600 border-b border-gray-100">
                    <button className="hover:underline" onClick={() => setBrowseFolderId('root')}>
                        My Drive
                    </button>
                    {(data?.breadcrumbs || []).map((b) => (
                        <span key={b.id} className="flex items-center gap-1">
                            <ChevronRight size={14} />
                            <button className="hover:underline" onClick={() => setBrowseFolderId(b.id)}>
                                {b.name}
                            </button>
                        </span>
                    ))}
                    {data?.folder && (
                        <span className="flex items-center gap-1">
                            <ChevronRight size={14} />
                            <span className="font-medium text-gray-800">{data.folder.name}</span>
                        </span>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto px-2 py-2 min-h-[200px]">
                    {loading ? (
                        <div className="text-center text-gray-400 py-8 text-sm">Loading...</div>
                    ) : subfolders.length === 0 ? (
                        <div className="text-center text-gray-400 py-8 text-sm">No folders here</div>
                    ) : (
                        subfolders.map((f) => (
                            <button
                                key={f.id}
                                onClick={() => setBrowseFolderId(f.id)}
                                className="w-full flex items-center px-3 py-2 rounded-md hover:bg-gray-100 text-left transition"
                            >
                                <Folder size={18} className="mr-3 text-gray-400" fill="#9ca3af" />
                                <span className="text-sm text-gray-800 truncate">{f.name}</span>
                            </button>
                        ))
                    )}
                </div>

                <div className="flex justify-end space-x-3 px-6 py-4 border-t border-gray-100 text-sm font-medium">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition">
                        Cancel
                    </button>
                    <button
                        disabled={isDisabledTarget}
                        onClick={() => onMove(browseFolderId === 'root' ? null : browseFolderId)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:hover:bg-blue-600"
                    >
                        Move here
                    </button>
                </div>
            </div>
        </div>
    );
}

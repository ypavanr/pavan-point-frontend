import { useRef, useEffect } from 'react';
import { FolderOpen, ExternalLink, Download, Edit2, FolderInput, Trash2, Lock, LockOpen, FileText, Copy } from 'lucide-react';

export default function ContextMenu({ x, y, onClose, item, onAction, canModify = true }) {
    const menuRef = useRef();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const style = {
        top: Math.min(y, window.innerHeight - 300),
        left: Math.min(x, window.innerWidth - 200),
    };

    return (
        <div ref={menuRef} style={style} className="fixed w-48 bg-white rounded-md shadow-xl border border-gray-200 py-1.5 z-50 text-sm">
            {item.isFolder ? (
                <button onClick={() => { onAction('open', item); onClose(); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center">
                    <FolderOpen size={16} className="mr-3 text-gray-500" /> Open
                </button>
            ) : item.isNote ? (
                <button onClick={() => { onAction('open', item); onClose(); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center">
                    <FileText size={16} className="mr-3 text-gray-500" /> Open
                </button>
            ) : (
                <>
                    <button onClick={() => { onAction('preview', item); onClose(); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center">
                        <ExternalLink size={16} className="mr-3 text-gray-500" /> Preview
                    </button>
                    {item.file_type === 'image' && (
                        <button onClick={() => { onAction('copy-image', item); onClose(); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center">
                            <Copy size={16} className="mr-3 text-gray-500" /> Copy Image
                        </button>
                    )}
                </>
            )}
            <button onClick={() => { onAction('download', item); onClose(); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center">
                <Download size={16} className="mr-3 text-gray-500" /> Download
            </button>
            {canModify && (
                <>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button onClick={() => { onAction('rename', item); onClose(); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center">
                        <Edit2 size={16} className="mr-3 text-gray-500" /> Rename
                    </button>
                    {!item.isNote && (
                        <button onClick={() => { onAction('move', item); onClose(); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center">
                            <FolderInput size={16} className="mr-3 text-gray-500" /> Move
                        </button>
                    )}
                    {item.isFolder && (
                        <button onClick={() => { onAction('toggle-private', item); onClose(); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center">
                            {item.is_private ? (
                                <><LockOpen size={16} className="mr-3 text-gray-500" /> Remove from private</>
                            ) : (
                                <><Lock size={16} className="mr-3 text-gray-500" /> Mark as private</>
                            )}
                        </button>
                    )}
                    <div className="border-t border-gray-100 my-1"></div>
                    <button onClick={() => { onAction('delete', item); onClose(); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center text-red-600">
                        <Trash2 size={16} className="mr-3 text-red-500" /> Delete
                    </button>
                </>
            )}
        </div>
    );
}

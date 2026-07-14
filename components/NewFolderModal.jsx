import { useState, useRef, useEffect } from 'react';
import { Lock } from 'lucide-react';

export default function NewFolderModal({ isOpen, onClose, onSubmit, initialName = "", showPrivateToggle = false, initialIsPrivate = false }) {
    const [name, setName] = useState(initialName);
    const [isPrivate, setIsPrivate] = useState(initialIsPrivate);
    const inputRef = useRef();

    useEffect(() => {
        if (isOpen) {
            setName(initialName);
            setIsPrivate(initialIsPrivate);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen, initialName, initialIsPrivate]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            onSubmit(name.trim(), isPrivate);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-96 p-6">
                <h2 className="text-xl font-medium mb-4">{initialName ? "Rename" : "New folder"}</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        ref={inputRef}
                        type="text"
                        className="w-full px-3 py-2 border border-blue-500 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 mb-4"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    {showPrivateToggle && (
                        <label className="flex items-center justify-between px-1 mb-6 cursor-pointer select-none">
                            <span className="flex items-center text-sm text-gray-700">
                                <Lock size={16} className="mr-2 text-gray-500" />
                                Mark as private
                            </span>
                            <input
                                type="checkbox"
                                checked={isPrivate}
                                onChange={(e) => setIsPrivate(e.target.checked)}
                                className="w-4 h-4 accent-blue-600"
                            />
                        </label>
                    )}
                    <div className="flex justify-end space-x-3 text-sm font-medium">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition">
                            Cancel
                        </button>
                        <button type="submit" disabled={!name.trim()} className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition disabled:opacity-50 disabled:hover:bg-transparent">
                            {initialName ? "OK" : "Create"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

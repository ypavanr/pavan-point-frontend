import React, { useState, useEffect } from 'react';
import { X, Upload, Trash2, Image as ImageIcon } from 'lucide-react';

export default function PasteUploadQueue({ onUpload }) {
    const [pastedFiles, setPastedFiles] = useState([]);

    useEffect(() => {
        const handlePaste = (e) => {
            // Do not intercept if user is typing in an input or textarea
            const active = document.activeElement;
            if (
                active &&
                (active.tagName === 'INPUT' ||
                 active.tagName === 'TEXTAREA' ||
                 active.isContentEditable)
            ) {
                return;
            }

            const items = (e.clipboardData || e.originalEvent.clipboardData).items;

            for (let index in items) {
                const item = items[index];
                if (item.kind === 'file' && item.type.startsWith('image/')) {
                    const blob = item.getAsFile();
                    if (blob) {
                        // Generate a unique file name
                        const extension = blob.type.split('/')[1] || 'png';
                        const filename = `Clipboard_Image_${Date.now()}_${Math.floor(Math.random() * 1000)}.${extension}`;
                        
                        // Create a new File object to ensure it has a proper name
                        const newFile = new File([blob], filename, { type: blob.type });

                        const previewUrl = URL.createObjectURL(newFile);
                        
                        setPastedFiles((prev) => [
                            ...prev,
                            { id: filename, file: newFile, previewUrl }
                        ]);
                    }
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => {
            window.removeEventListener('paste', handlePaste);
        };
    }, []);

    // Cleanup URLs to avoid memory leaks
    useEffect(() => {
        return () => {
            pastedFiles.forEach(pf => URL.revokeObjectURL(pf.previewUrl));
        };
    }, [pastedFiles]);

    const handleUploadAll = () => {
        if (pastedFiles.length > 0 && onUpload) {
            const filesToUpload = pastedFiles.map(pf => pf.file);
            onUpload(filesToUpload);
            handleClear();
        }
    };

    const handleClear = () => {
        setPastedFiles([]);
    };

    const handleRemoveItem = (idToRemove) => {
        setPastedFiles((prev) => prev.filter(pf => pf.id !== idToRemove));
    };

    if (pastedFiles.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[60] w-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <ImageIcon size={18} />
                    <span className="font-semibold">Clipboard Upload ({pastedFiles.length})</span>
                </div>
                <button onClick={handleClear} className="text-blue-100 hover:text-white transition-colors">
                    <X size={20} />
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {pastedFiles.map((pf) => (
                    <div key={pf.id} className="relative group rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm flex items-center p-2">
                        <img 
                            src={pf.previewUrl} 
                            alt="Pasted preview" 
                            className="w-16 h-16 object-cover rounded-md border border-gray-100"
                        />
                        <div className="ml-3 flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{pf.file.name}</p>
                            <p className="text-xs text-gray-500">{(pf.file.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button 
                            onClick={() => handleRemoveItem(pf.id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            title="Remove"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>
            
            <div className="p-4 bg-white border-t border-gray-200 flex justify-end space-x-3">
                <button 
                    onClick={handleClear}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleUploadAll}
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                >
                    <Upload size={16} />
                    <span>Upload All</span>
                </button>
            </div>
        </div>
    );
}

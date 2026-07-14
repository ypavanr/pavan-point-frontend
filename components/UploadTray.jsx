import { X, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

export default function UploadTray({ uploads, setUploads }) {
    const [isMinimized, setIsMinimized] = useState(false);

    if (uploads.length === 0) return null;

    const completed = uploads.filter(u => u.status === 'success').length;
    const total = uploads.length;
    const title = completed === total ? `${completed} uploads complete` : `Uploading ${total} item${total > 1 ? 's' : ''}`;

    return (
        <div className="fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
            <div className="bg-gray-800 text-white px-4 py-3 flex justify-between items-center cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
                <span className="font-medium text-sm">{title}</span>
                <div className="flex space-x-2 text-gray-300">
                    <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}>
                        {isMinimized ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setUploads([]); }}>
                        <X size={18} />
                    </button>
                </div>
            </div>
            {!isMinimized && (
                <div className="max-h-64 overflow-y-auto">
                    {uploads.map(upload => (
                        <div key={upload.id} className="flex items-center px-4 py-3 border-b border-gray-100 last:border-0">
                            <div className="flex-1 truncate text-sm text-gray-700 mr-4">
                                {upload.filename}
                            </div>
                            <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                                {upload.status === 'uploading' && (
                                    <div className="relative w-5 h-5">
                                        <svg className="w-5 h-5 text-gray-200" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                        </svg>
                                        <svg className="w-5 h-5 text-blue-600 absolute top-0 left-0" viewBox="0 0 24 24" style={{ transform: 'rotate(-90deg)' }}>
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="62.8" strokeDashoffset={62.8 - (upload.progress / 100) * 62.8} className="transition-all duration-300"></circle>
                                        </svg>
                                    </div>
                                )}
                                {upload.status === 'success' && <CheckCircle size={20} className="text-green-500" />}
                                {upload.status === 'error' && <AlertCircle size={20} className="text-red-500" title={upload.error} />}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

import { X, Folder, Image as ImageIcon, Film, File as FileIcon, HardDrive } from 'lucide-react';

const formatBytes = (bytes) => {
    if (bytes === 0 || bytes === undefined) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function FolderInfoModal({ isOpen, onClose, folder, folderName }) {
    if (!isOpen || !folder) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                        <Folder size={24} className="mr-3 text-blue-500" fill="#3b82f6" />
                        {folderName || 'My Drive'} Details
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition rounded-full p-1 hover:bg-gray-100">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-blue-50 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                            <HardDrive size={28} className="text-blue-500 mb-2" />
                            <span className="text-2xl font-bold text-gray-800">{formatBytes(folder.size_bytes)}</span>
                            <span className="text-sm font-medium text-blue-700 mt-1">Total Size</span>
                        </div>
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                            <FileIcon size={28} className="text-gray-500 mb-2" />
                            <span className="text-2xl font-bold text-gray-800">{folder.total_files || 0}</span>
                            <span className="text-sm font-medium text-gray-600 mt-1">Total Files</span>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Contents Breakdown</h4>
                        
                        <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition">
                            <div className="flex items-center">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg mr-3">
                                    <ImageIcon size={20} />
                                </div>
                                <span className="font-medium text-gray-700">Images</span>
                            </div>
                            <span className="text-gray-600 font-semibold">{folder.total_images || 0}</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition">
                            <div className="flex items-center">
                                <div className="p-2 bg-red-100 text-red-600 rounded-lg mr-3">
                                    <Film size={20} />
                                </div>
                                <span className="font-medium text-gray-700">Videos</span>
                            </div>
                            <span className="text-gray-600 font-semibold">{folder.total_videos || 0}</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition">
                            <div className="flex items-center">
                                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg mr-3">
                                    <FileIcon size={20} />
                                </div>
                                <span className="font-medium text-gray-700">Other Files</span>
                            </div>
                            <span className="text-gray-600 font-semibold">{folder.total_other || 0}</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition">
                            <div className="flex items-center">
                                <div className="p-2 bg-gray-200 text-gray-600 rounded-lg mr-3">
                                    <Folder size={20} />
                                </div>
                                <span className="font-medium text-gray-700">Nested Folders</span>
                            </div>
                            <span className="text-gray-600 font-semibold">{folder.total_folders || 0}</span>
                        </div>
                    </div>
                </div>
                
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:ring-4 focus:ring-blue-100"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

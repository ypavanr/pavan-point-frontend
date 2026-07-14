import { ChevronRight } from 'lucide-react';

export default function Breadcrumbs({ breadcrumbs, currentFolder, onNavigate }) {
    return (
        <div className="flex items-center space-x-1 text-xl text-gray-700 mb-6 px-2">
            <button
                className="hover:bg-gray-100 px-2 py-1 rounded-md transition"
                onClick={() => onNavigate('root')}
            >
                My Drive
            </button>
            
            {breadcrumbs.map((folder, index) => (
                <div key={folder.id} className="flex items-center space-x-1">
                    <ChevronRight size={18} className="text-gray-400" />
                    <button
                        className="hover:bg-gray-100 px-2 py-1 rounded-md transition"
                        onClick={() => onNavigate(folder.id)}
                    >
                        {folder.name}
                    </button>
                </div>
            ))}
            
            {currentFolder && (
                <div className="flex items-center space-x-1">
                    <ChevronRight size={18} className="text-gray-400" />
                    <span className="px-2 py-1 font-medium">{currentFolder.name}</span>
                </div>
            )}
        </div>
    );
}

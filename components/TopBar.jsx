import { Search, LayoutGrid, List, LogOut, Info, History } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function TopBar({ searchQuery, setSearchQuery, viewMode, setViewMode, onInfoClick, onLogsClick }) {
    const { logout, isMaster } = useAuth();

    return (
        <div className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-4 flex-shrink-0">
            <div className="flex items-center w-1/3 text-xl font-medium text-gray-700">
                <div className="w-8 h-8 mr-2" aria-hidden="true" />
                Drive
            </div>

            <div className="flex-1 max-w-2xl">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={20} className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-transparent rounded-full bg-gray-100 focus:bg-white focus:border-gray-300 focus:ring-0 focus:shadow-md transition-all text-gray-900"
                        placeholder="Search in Drive"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex items-center justify-end w-1/3 space-x-2 pr-4">
                {isMaster && (
                    <button
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition"
                        onClick={onLogsClick}
                        title="Viewer login history"
                    >
                        <History size={22} />
                    </button>
                )}
                <button
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition"
                    onClick={onInfoClick}
                    title="Folder Info"
                >
                    <Info size={22} />
                </button>
                <button
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition"
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    title={viewMode === 'grid' ? "List view" : "Grid view"}
                >
                    {viewMode === 'grid' ? <List size={22} /> : <LayoutGrid size={22} />}
                </button>
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition" onClick={logout} title="Log out">
                    <LogOut size={22} />
                </button>
            </div>
        </div>
    );
}


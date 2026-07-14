import { Plus, FolderPlus, FileUp, FolderUp, HardDrive, ChevronRight, ChevronDown, Folder, Lock, FileText } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import api from '@/lib/api';
import clsx from 'clsx';

function FolderTreeNode({ node, level = 0, currentFolderId, onNavigate }) {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const hasChildren = node.subfolders && node.subfolders.length > 0;
    const isSelected = currentFolderId === node.id;
    
    return (
        <div className="w-full">
            <div 
                className={clsx(
                    "flex items-center py-1.5 px-2 rounded hover:bg-gray-100 cursor-pointer text-sm group",
                    isSelected ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"
                )}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={() => onNavigate(node.id)}
            >
                <div 
                    className="w-5 h-5 flex items-center justify-center mr-1 cursor-pointer text-gray-400 hover:text-gray-600"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (hasChildren) setIsExpanded(!isExpanded);
                    }}
                >
                    {hasChildren ? (isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />) : <span className="w-4" />}
                </div>
                <Folder size={16} className={clsx("mr-2", isSelected ? "text-blue-500" : "text-gray-400")} fill={isSelected ? "#3b82f6" : "#9ca3af"} />
                <span className="truncate">{node.name}</span>
                {node.is_private && <Lock size={12} className="ml-1.5 text-gray-400 flex-shrink-0" />}
            </div>
            
            {isExpanded && hasChildren && (
                <div className="flex flex-col">
                    {node.subfolders.map(child => (
                        <FolderTreeNode 
                            key={child.id} 
                            node={child} 
                            level={level + 1} 
                            currentFolderId={currentFolderId} 
                            onNavigate={onNavigate} 
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Sidebar({ currentFolderId, onNavigate, updateTrigger, onNewFolder, onNewNote, onUploadFiles, onUploadFolder, storageUsed, totalStorage, isMaster = true }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [treeData, setTreeData] = useState([]);
    const menuRef = useRef(null);
    const fileInputRef = useRef(null);
    const folderInputRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        api.get('/api/folders/tree').then(res => setTreeData(res.data)).catch(console.error);
    }, [updateTrigger]);

    const formatBytes = (bytes) => {
        if (bytes === 0 || bytes === undefined) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="w-64 bg-gray-50 h-full border-r border-gray-200 flex flex-col pt-4 px-3 flex-shrink-0">
            {isMaster && (
                <div className="relative mb-6" ref={menuRef}>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center space-x-3 px-5 py-4 bg-white border border-gray-300 rounded-2xl shadow-sm hover:bg-gray-50 transition text-gray-700 font-medium w-36"
                    >
                        <Plus size={24} className="text-gray-700" />
                        <span>New</span>
                    </button>

                    {isMenuOpen && (
                        <div className="absolute top-16 left-0 w-64 bg-white border border-gray-200 rounded-md shadow-lg py-2 z-50">
                            <button onClick={() => { onNewFolder(); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center">
                                <FolderPlus size={20} className="mr-3 text-gray-500" />
                                New folder
                            </button>
                            <div className="border-t border-gray-100 my-1"></div>
                            <button onClick={() => fileInputRef.current?.click()} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center">
                                <FileUp size={20} className="mr-3 text-gray-500" />
                                File upload
                            </button>
                            <button onClick={() => folderInputRef.current?.click()} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center">
                                <FolderUp size={20} className="mr-3 text-gray-500" />
                                Folder upload
                            </button>
                            <div className="border-t border-gray-100 my-1"></div>
                            <button onClick={() => { onNewNote(); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center">
                                <FileText size={20} className="mr-3 text-gray-500" />
                                New note
                            </button>
                        </div>
                    )}

                    <input type="file" multiple className="hidden" ref={fileInputRef} onChange={(e) => { onUploadFiles(e.target.files); setIsMenuOpen(false); e.target.value = null; }} />
                    <input type="file" webkitdirectory="" directory="" className="hidden" ref={folderInputRef} onChange={(e) => { onUploadFolder(e.target.files); setIsMenuOpen(false); e.target.value = null; }} />
                </div>
            )}

            <nav className="flex-1 overflow-y-auto overflow-x-hidden pr-2">
                <button 
                    onClick={() => onNavigate('root')}
                    className={clsx(
                        "w-full flex items-center px-4 py-2 mb-2 rounded-full font-medium transition",
                        currentFolderId === 'root' ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-200"
                    )}
                >
                    <HardDrive size={20} className="mr-3" />
                    My Drive
                </button>
                
                <div className="flex flex-col space-y-0.5 ml-2">
                    {treeData.map(node => (
                        <FolderTreeNode 
                            key={node.id} 
                            node={node} 
                            currentFolderId={currentFolderId} 
                            onNavigate={onNavigate} 
                        />
                    ))}
                </div>
            </nav>

            <div className="mb-6 px-4 mt-4">
                <div className="flex items-center text-gray-600 mb-2 font-medium">
                    <HardDrive size={20} className="mr-2" />
                    <span>Storage</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min((storageUsed / (totalStorage || 15 * 1024 * 1024 * 1024)) * 100, 100)}%` }}></div>
                </div>
                <div className="text-sm text-gray-500">
                    {formatBytes(storageUsed)} used
                </div>
            </div>
        </div>
    );
}


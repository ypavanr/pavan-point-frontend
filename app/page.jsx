"use client";

import { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import Breadcrumbs from '@/components/Breadcrumbs';
import UploadTray from '@/components/UploadTray';
import PasteUploadQueue from '@/components/PasteUploadQueue';
import ContextMenu from '@/components/ContextMenu';
import PreviewModal from '@/components/PreviewModal';
import NoteEditorModal from '@/components/NoteEditorModal';
import NewFolderModal from '@/components/NewFolderModal';
import MoveModal from '@/components/MoveModal';
import { Folder, Image as ImageIcon, Film, File as FileIcon, FileText, CheckSquare, SearchX, Lock, Play } from 'lucide-react';
import clsx from 'clsx';
import { useRouter, useSearchParams } from 'next/navigation';
import Selecto from 'react-selecto';
import FolderInfoModal from '@/components/FolderInfoModal';
import LogsModal from '@/components/LogsModal';
import { useToast, errorMessage } from '@/components/Toast';

const formatBytes = (bytes) => {
    if (bytes === 0 || bytes === undefined) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

function DriveContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const folderParam = searchParams.get('folder');
    
    const { isAuthenticated, isLoading, isMaster } = useAuth();
    const { showToast } = useToast();
    const [currentFolderId, setCurrentFolderId] = useState(folderParam || 'root');
    const [folderData, setFolderData] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [isSearchLoading, setIsSearchLoading] = useState(false);
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [uploads, setUploads] = useState([]);
    const [contextMenu, setContextMenu] = useState(null);
    const [previewItem, setPreviewItem] = useState(null);
    const [openNoteId, setOpenNoteId] = useState(null);
    const [folderModal, setFolderModal] = useState({ isOpen: false, initialName: "", mode: "create", item: null });
    const [moveModal, setMoveModal] = useState({ isOpen: false, item: null });
    const [infoModalOpen, setInfoModalOpen] = useState(false);
    const [logsModalOpen, setLogsModalOpen] = useState(false);
    const [storageUsed, setStorageUsed] = useState(0);
    const [updateTrigger, setUpdateTrigger] = useState(0);

    const isSearching = searchQuery.trim().length > 0;

    const fetchFolderContents = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const res = await api.get(`/api/folders/${currentFolderId}`);
            setFolderData(res.data);
            setSelectedItems(new Set());
        } catch (error) {
            console.error("Failed to fetch folder contents", error);
        }
    }, [currentFolderId, isAuthenticated]);

    const fetchStorageUsage = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const res = await api.get('/api/files/storage-usage');
            setStorageUsed(res.data.used_bytes);
        } catch (error) {
            console.error("Failed to fetch storage usage", error);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchFolderContents();
    }, [fetchFolderContents]);

    // Keep state in sync with URL
    useEffect(() => {
        if (folderParam && folderParam !== currentFolderId) {
            setCurrentFolderId(folderParam);
        } else if (!folderParam && currentFolderId !== 'root') {
            setCurrentFolderId('root');
        }
    }, [folderParam]);

    useEffect(() => {
        fetchStorageUsage();
    }, [fetchStorageUsage]);

    // Debounce the search box so we don't hit the API on every keystroke.
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
        return () => clearTimeout(t);
    }, [searchQuery]);

    useEffect(() => {
        if (!debouncedQuery || !isAuthenticated) {
            setSearchResults(null);
            return undefined;
        }
        let cancelled = false;
        setIsSearchLoading(true);
        api.get('/api/folders/search', { params: { q: debouncedQuery } })
            .then((res) => { if (!cancelled) setSearchResults(res.data); })
            .catch(() => { if (!cancelled) setSearchResults({ folders: [], files: [] }); })
            .finally(() => { if (!cancelled) setIsSearchLoading(false); });
        return () => { cancelled = true; };
    }, [debouncedQuery, isAuthenticated]);

    const refreshView = useCallback(() => {
        if (debouncedQuery) {
            api.get('/api/folders/search', { params: { q: debouncedQuery } })
                .then((res) => setSearchResults(res.data))
                .catch(() => {});
        } else {
            fetchFolderContents();
        }
        fetchStorageUsage();
        setUpdateTrigger(prev => prev + 1);
    }, [debouncedQuery, fetchFolderContents, fetchStorageUsage]);

    const items = useMemo(() => {
        if (isSearching) {
            if (!searchResults) return [];
            return [
                ...searchResults.folders.map((f) => ({ ...f, isFolder: true })),
                ...searchResults.files.map((f) => ({ ...f, isFolder: false })),
            ];
        }
        if (!folderData) return [];
        // Files and notes share the grid/list together, sorted by name - only
        // folders get their own leading section.
        const filesAndNotes = [
            ...folderData.files.map((f) => ({ ...f, isFolder: false, isNote: false })),
            ...(folderData.notes || []).map((n) => ({
                ...n,
                isFolder: false,
                isNote: true,
                original_filename: n.title,
                file_type: 'note',
                size_bytes: 0,
            })),
        ].sort((a, b) => (a.original_filename || '').localeCompare(b.original_filename || ''));
        return [
            ...folderData.subfolders.map((f) => ({ ...f, isFolder: true })),
            ...filesAndNotes,
        ];
    }, [isSearching, searchResults, folderData]);

    // Auto-poll if thumbnails are missing
    useEffect(() => {
        if (isSearching) return;
        
        const hasMissingThumbnails = items.some(item => 
            !item.isFolder && 
            (item.file_type === 'video' || item.file_type === 'image') && 
            !item.has_thumbnail
        );
        
        if (hasMissingThumbnails) {
            const interval = setInterval(() => {
                fetchFolderContents();
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [items, isSearching, fetchFolderContents]);

    const handleNavigate = (folderId) => {
        setSearchQuery('');
        setCurrentFolderId(folderId);
        if (folderId === 'root') {
            router.push('/');
        } else {
            router.push(`/?folder=${folderId}`);
        }
    };

    const uploadSingleFile = async (file, folderId, uploadId) => {
        const formData = new FormData();
        formData.append('file', file);
        if (folderId && folderId !== 'root') {
            formData.append('folder_id', folderId);
        }

        try {
            await api.post('/api/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
                    setUploads((prev) => prev.map((u) => (u.id === uploadId ? { ...u, progress: percentCompleted } : u)));
                },
            });
            setUploads((prev) => prev.map((u) => (u.id === uploadId ? { ...u, status: 'success', progress: 100 } : u)));
        } catch (error) {
            setUploads((prev) => prev.map((u) => (u.id === uploadId ? { ...u, status: 'error', error: error.response?.data?.detail || "Upload failed" } : u)));
        }
    };

    const handleUploadFiles = async (files) => {
        if (!isMaster) return;
        const fileArray = Array.from(files).filter(f => !f.name.startsWith('.'));
        const newUploads = fileArray.map((file) => ({
            id: crypto.randomUUID(),
            filename: file.name,
            progress: 0,
            status: 'uploading',
        }));
        setUploads((prev) => [...prev, ...newUploads]);

        for (let i = 0; i < fileArray.length; i++) {
            await uploadSingleFile(fileArray[i], currentFolderId, newUploads[i].id);
        }
        refreshView();
    };

    // Creates the folder if it doesn't exist yet, or reuses it if it does -
    // needed because a folder upload can span many files sharing the same directory.
    const getOrCreateFolder = async (name, parentId) => {
        try {
            const res = await api.post('/api/folders', { name, parent_id: parentId === 'root' ? null : parentId });
            return res.data.id;
        } catch (error) {
            if (error.response?.status === 400) {
                const listRes = await api.get(`/api/folders/${parentId}`);
                const existing = listRes.data.subfolders.find((f) => f.name === name);
                if (existing) return existing.id;
            }
            throw error;
        }
    };

    const handleUploadFolder = async (files) => {
        if (!isMaster) return;
        const fileArray = Array.from(files).filter((f) => f.webkitRelativePath && !f.name.startsWith('.'));
        if (fileArray.length === 0) return;

        // Maps a relative directory path (e.g. "Vacation/2024") to its resolved folder id.
        const folderCache = new Map();
        folderCache.set('', currentFolderId);

        const resolveFolderId = async (dirPath) => {
            if (folderCache.has(dirPath)) return folderCache.get(dirPath);
            const parts = dirPath.split('/');
            let parentPath = '';
            let parentId = currentFolderId;
            for (const part of parts) {
                const path = parentPath ? `${parentPath}/${part}` : part;
                if (!folderCache.has(path)) {
                    const newId = await getOrCreateFolder(part, parentId);
                    folderCache.set(path, newId);
                }
                parentId = folderCache.get(path);
                parentPath = path;
            }
            return parentId;
        };

        const newUploads = fileArray.map((file) => ({
            id: crypto.randomUUID(),
            filename: file.webkitRelativePath,
            progress: 0,
            status: 'uploading',
        }));
        setUploads((prev) => [...prev, ...newUploads]);

        for (let i = 0; i < fileArray.length; i++) {
            const file = fileArray[i];
            const relPath = file.webkitRelativePath;
            const lastSlash = relPath.lastIndexOf('/');
            const dirPath = lastSlash >= 0 ? relPath.substring(0, lastSlash) : '';
            try {
                const targetFolderId = await resolveFolderId(dirPath);
                await uploadSingleFile(file, targetFolderId, newUploads[i].id);
            } catch (error) {
                setUploads((prev) => prev.map((u) => (u.id === newUploads[i].id ? { ...u, status: 'error', error: 'Failed to create destination folder' } : u)));
            }
        }
        refreshView();
    };

    const handleCreateFolder = async (name, isPrivate) => {
        try {
            await api.post('/api/folders', {
                name,
                parent_id: currentFolderId === 'root' ? null : currentFolderId,
                is_private: isMaster ? !!isPrivate : false,
            });
            setFolderModal({ isOpen: false });
            refreshView();
        } catch (error) {
            showToast(errorMessage(error, "Failed to create folder"));
        }
    };

    const handleRename = async (name) => {
        try {
            if (folderModal.item.isFolder) {
                await api.patch(`/api/folders/${folderModal.item.id}`, { name });
            } else if (folderModal.item.isNote) {
                await api.patch(`/api/notes/${folderModal.item.id}`, { title: name });
            } else {
                await api.patch(`/api/files/${folderModal.item.id}`, { name });
            }
            setFolderModal({ isOpen: false });
            refreshView();
        } catch (error) {
            showToast(errorMessage(error, "Failed to rename"));
        }
    };

    const handleCreateNote = async () => {
        try {
            const res = await api.post('/api/notes', {
                title: 'Untitled note',
                folder_id: currentFolderId === 'root' ? null : currentFolderId,
                content_json: { type: 'doc', content: [{ type: 'paragraph' }] },
            });
            refreshView();
            setOpenNoteId(res.data.id);
        } catch (error) {
            showToast(errorMessage(error, "Failed to create note"));
        }
    };

    // Privacy can be toggled on a folder at any time, independent of renaming -
    // not just at creation time.
    const handleTogglePrivate = async (item) => {
        try {
            await api.patch(`/api/folders/${item.id}`, { is_private: !item.is_private });
            refreshView();
        } catch (error) {
            showToast(errorMessage(error, "Failed to update folder"));
        }
    };

    const handleMove = async (destFolderId) => {
        const item = moveModal.item;
        try {
            if (item.isFolder) {
                await api.post(`/api/folders/${item.id}/move`, { folder_id: destFolderId });
            } else {
                await api.post(`/api/files/${item.id}/move`, { folder_id: destFolderId });
            }
            setMoveModal({ isOpen: false, item: null });
            refreshView();
        } catch (error) {
            showToast(errorMessage(error, "Failed to move"));
        }
    };

    const handleDelete = async (item) => {
        if (!confirm(`Are you sure you want to delete "${item.isFolder ? item.name : item.original_filename}"?`)) return;
        try {
            if (item.isFolder) {
                await api.delete(`/api/folders/${item.id}`);
            } else if (item.isNote) {
                await api.delete(`/api/notes/${item.id}`);
            } else {
                await api.delete(`/api/files/${item.id}`);
            }
            refreshView();
        } catch (error) {
            showToast(errorMessage(error, "Failed to delete"));
        }
    };

    const downloadBlob = (blob, filename) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const handleDownload = async (item) => {
        if (item.isFolder) {
            try {
                const response = await api.post('/api/files/download-zip', { folder_ids: [item.id], file_ids: [] }, { responseType: 'blob' });
                downloadBlob(response.data, `${item.name}.zip`);
            } catch (error) {
                showToast(errorMessage(error, "Download failed"));
            }
        } else if (item.isNote) {
            try {
                const response = await api.get(`/api/notes/${item.id}/export`, { responseType: 'blob' });
                downloadBlob(response.data, `${item.original_filename || 'note'}.txt`);
            } catch (error) {
                showToast(errorMessage(error, "Download failed"));
            }
        } else {
            try {
                const response = await api.get(`/api/files/${item.id}/download`, { responseType: 'blob' });
                downloadBlob(response.data, item.original_filename);
            } catch (error) {
                showToast(errorMessage(error, "Download failed"));
            }
        }
    };

    const handleCopyImage = async (item) => {
        try {
            const response = await api.get(`/api/files/${item.id}/preview`, { responseType: 'blob' });
            const blob = response.data;
            if (blob.type.startsWith('image/')) {
                try {
                    const clipboardItem = new ClipboardItem({ [blob.type]: blob });
                    await navigator.clipboard.write([clipboardItem]);
                    showToast('Image copied to clipboard');
                } catch (err) {
                    // Fallback: Convert to PNG as many browsers only support image/png in clipboard
                    const bitmap = await createImageBitmap(blob);
                    const canvas = document.createElement('canvas');
                    canvas.width = bitmap.width;
                    canvas.height = bitmap.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(bitmap, 0, 0);
                    canvas.toBlob(async (pngBlob) => {
                        try {
                            const clipboardItem = new ClipboardItem({ 'image/png': pngBlob });
                            await navigator.clipboard.write([clipboardItem]);
                            showToast('Image copied to clipboard');
                        } catch (fallbackErr) {
                            console.error("Fallback copy failed:", fallbackErr);
                            showToast('Failed to copy image format to clipboard');
                        }
                    }, 'image/png');
                }
            } else {
                showToast('Only images can be copied');
            }
        } catch (error) {
            console.error("Copy failed:", error);
            showToast(errorMessage(error, "Failed to copy image to clipboard"));
        }
    };

    const handleDownloadSelected = async () => {
        if (selectedItems.size === 0) return;
        const fileIds = [];
        const folderIds = [];
        const noteIds = [];

        selectedItems.forEach((id) => {
            const found = items.find((i) => i.id === id);
            if (found?.isFolder) folderIds.push(id);
            else if (found?.isNote) noteIds.push(id);
            else fileIds.push(id);
        });

        try {
            const response = await api.post('/api/files/download-zip', { folder_ids: folderIds, file_ids: fileIds, note_ids: noteIds }, { responseType: 'blob' });
            downloadBlob(response.data, `drive_download.zip`);
            setSelectedItems(new Set());
        } catch (error) {
            showToast(errorMessage(error, "Download failed"));
        }
    };

    const handleDeleteSelected = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedItems.size} item(s)?`)) return;

        const fileIds = [];
        const folderIds = [];
        const noteIds = [];

        selectedItems.forEach((id) => {
            const found = items.find((i) => i.id === id);
            if (found?.isFolder) folderIds.push(id);
            else if (found?.isNote) noteIds.push(id);
            else fileIds.push(id);
        });

        try {
            for (let id of folderIds) await api.delete(`/api/folders/${id}`);
            for (let id of fileIds) await api.delete(`/api/files/${id}`);
            for (let id of noteIds) await api.delete(`/api/notes/${id}`);
            setSelectedItems(new Set());
            refreshView();
        } catch (error) {
            showToast(errorMessage(error, "Delete failed partially or completely"));
            refreshView();
        }
    };

    const toggleSelection = (e, id) => {
        e.stopPropagation();
        const newSet = new Set(selectedItems);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedItems(newSet);
    };

    const handleContextMenu = (e, item) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            item: item,
        });
    };

    const onContextMenuAction = (action, item) => {
        if (action === 'preview') {
            if (item.isNote) setOpenNoteId(item.id);
            else setPreviewItem(item);
        }
        if (action === 'open') {
            if (item.isFolder) handleNavigate(item.id);
            else if (item.isNote) setOpenNoteId(item.id);
            else setPreviewItem(item);
        }
        if (action === 'download') handleDownload(item);
        if (action === 'rename') setFolderModal({ isOpen: true, initialName: item.isFolder ? item.name : item.original_filename, mode: "rename", item });
        if (action === 'move') setMoveModal({ isOpen: true, item });
        if (action === 'toggle-private') handleTogglePrivate(item);
        if (action === 'delete') handleDelete(item);
        if (action === 'copy-image') handleCopyImage(item);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        if (!isMaster) return;
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleUploadFiles(e.dataTransfer.files);
        }
    };

    if (isLoading || !isAuthenticated) return null;

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-white" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
            <Sidebar
                currentFolderId={currentFolderId}
                onNavigate={handleNavigate}
                updateTrigger={updateTrigger}
                onNewFolder={() => setFolderModal({ isOpen: true, initialName: "", mode: "create", item: null })}
                onNewNote={handleCreateNote}
                onUploadFiles={(files) => handleUploadFiles(files)}
                onUploadFolder={(files) => handleUploadFolder(files)}
                storageUsed={storageUsed}
                totalStorage={15 * 1024 * 1024 * 1024}
                isMaster={isMaster}
            />

            <div className="flex-1 flex flex-col min-w-0">
                <TopBar
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    onInfoClick={() => setInfoModalOpen(true)}
                    onLogsClick={() => setLogsModalOpen(true)}
                />

                <div className="flex-1 overflow-y-auto p-4 md:p-6 relative selecto-container">
                    <Selecto
                        dragContainer=".selecto-container"
                        selectableTargets={[".selectable-item"]}
                        hitRate={0}
                        selectByClick={false}
                        selectFromInside={false}
                        toggleContinueSelect={["shift"]}
                        onSelect={(e) => {
                            const newSet = new Set(selectedItems);
                            e.added.forEach(el => newSet.add(el.dataset.id));
                            e.removed.forEach(el => newSet.delete(el.dataset.id));
                            setSelectedItems(newSet);
                        }}
                        onDragStart={(e) => {
                            if (e.inputEvent.target.closest('button') || e.inputEvent.target.closest('.sticky')) {
                                e.stop();
                            }
                        }}
                    />

                    {isSearching ? (
                        <div className="text-xl text-gray-700 mb-6 px-2">
                            Search results for &quot;{debouncedQuery || searchQuery}&quot;
                            {isSearchLoading && <span className="text-sm text-gray-400 ml-2">Searching...</span>}
                        </div>
                    ) : (
                        <Breadcrumbs
                            breadcrumbs={folderData?.breadcrumbs || []}
                            currentFolder={folderData?.folder}
                            onNavigate={handleNavigate}
                        />
                    )}

                    {selectedItems.size > 0 && (
                        <div className="sticky top-0 z-20 bg-blue-50 border-b border-blue-200 p-3 mb-4 flex items-center justify-between shadow-sm -mt-4 -mx-4 md:-mt-6 md:-mx-6 px-4 md:px-6">
                            <span className="text-blue-800 font-medium">{selectedItems.size} item(s) selected</span>
                            <div className="flex space-x-2">
                                <button onClick={handleDownloadSelected} className="px-3 py-1.5 bg-white border border-blue-200 rounded text-blue-700 hover:bg-blue-100 font-medium text-sm transition">
                                    Download
                                </button>
                                {isMaster && (
                                    <button onClick={handleDeleteSelected} className="px-3 py-1.5 bg-white border border-red-200 rounded text-red-600 hover:bg-red-50 font-medium text-sm transition">
                                        Delete
                                    </button>
                                )}
                                <button onClick={() => setSelectedItems(new Set())} className="px-3 py-1.5 text-blue-600 hover:bg-blue-100 rounded font-medium text-sm transition">
                                    Clear
                                </button>
                            </div>
                        </div>
                    )}

                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {items.map(item => (
                                <div
                                    key={item.id}
                                    data-id={item.id}
                                    onContextMenu={(e) => handleContextMenu(e, item)}
                                    onClick={(e) => {
                                        if (e.ctrlKey || e.metaKey) toggleSelection(e, item.id);
                                        else if (item.isFolder) handleNavigate(item.id);
                                        else if (item.isNote) setOpenNoteId(item.id);
                                        else setPreviewItem(item);
                                    }}
                                    className={clsx(
                                        "selectable-item group relative flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition",
                                        selectedItems.has(item.id) ? "bg-blue-50 border-blue-400" : "bg-white border-gray-200 hover:bg-gray-50"
                                    )}
                                >
                                    <button 
                                        type="button"
                                        className={clsx(
                                            "absolute top-1 left-1 w-9 h-9 flex items-center justify-center transition z-10 rounded-full hover:bg-gray-200",
                                            selectedItems.has(item.id) ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                        )}
                                        onClick={(e) => { e.stopPropagation(); toggleSelection(e, item.id); }}
                                        title="Select item"
                                    >
                                        <CheckSquare className={clsx("w-5 h-5", selectedItems.has(item.id) ? "text-blue-600 opacity-100" : "text-gray-400")} />
                                    </button>
                                    <button 
                                        className="absolute top-1 right-1 w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-600 hover:text-gray-900 opacity-0 group-hover:opacity-100 transition z-10 text-xl font-bold" 
                                        onClick={(e) => { e.stopPropagation(); handleContextMenu(e, item); }}
                                        title="More actions"
                                    >
                                        ⋮
                                    </button>

                                    <div className="w-24 h-24 mb-3 flex items-center justify-center overflow-hidden rounded-lg bg-gray-100 relative">
                                        {item.isFolder ? (
                                            <Folder size={64} className="text-gray-400" fill="#9ca3af" />
                                        ) : item.isNote ? (
                                            <FileText size={48} className="text-amber-500" />
                                        ) : item.has_thumbnail ? (
                                            <>
                                                <img src={`${api.defaults.baseURL}/api/files/${item.id}/thumbnail?token=${typeof window !== 'undefined' ? sessionStorage.getItem('token') : ''}`} alt="" className="w-full h-full object-cover" />
                                                {item.file_type === 'video' && (
                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                        <div className="bg-black/30 rounded-full p-2 backdrop-blur-sm flex items-center justify-center shadow-sm">
                                                            <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            item.file_type === 'image' ? <ImageIcon size={48} className="text-blue-500" /> :
                                            item.file_type === 'video' ? <Film size={48} className="text-red-500" /> :
                                            <FileIcon size={48} className="text-gray-500" />
                                        )}
                                        {item.isFolder && item.is_private && (
                                            <div className="absolute bottom-1 right-1 bg-white/90 rounded-full p-1 shadow-sm" title="Private folder">
                                                <Lock size={12} className="text-red-600" />
                                            </div>
                                        )}
                                    </div>

                                    <span className="text-sm font-medium text-gray-700 text-center w-full truncate px-1">
                                        {item.isFolder ? item.name : item.original_filename}
                                    </span>
                                    {isSearching && item.path && (
                                        <span className="text-xs text-gray-400 text-center w-full truncate px-1 mt-0.5">
                                            {item.path}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="w-12 px-4 py-3 text-left"></th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                        {isSearching && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>}
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                                        <th className="px-6 py-3 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {items.map(item => (
                                        <tr
                                            key={item.id}
                                            data-id={item.id}
                                            onClick={(e) => {
                                                if (e.ctrlKey || e.metaKey) toggleSelection(e, item.id);
                                                else if (item.isFolder) handleNavigate(item.id);
                                                else if (item.isNote) setOpenNoteId(item.id);
                                                else setPreviewItem(item);
                                            }}
                                            onContextMenu={(e) => handleContextMenu(e, item)}
                                            className={clsx(
                                                "selectable-item cursor-pointer hover:bg-gray-50 transition group",
                                                selectedItems.has(item.id) && "bg-blue-50"
                                            )}
                                        >
                                            <td className="px-4 py-4 whitespace-nowrap" onClick={(e) => { e.stopPropagation(); toggleSelection(e, item.id); }}>
                                                <CheckSquare className={clsx("w-5 h-5", selectedItems.has(item.id) ? "text-blue-600" : "text-gray-300 opacity-0 group-hover:opacity-100")} />
                                            </td>
                                            <td className="px-6 py-4 flex items-center">
                                                {item.isFolder ? <Folder size={20} className="mr-3 text-gray-400 flex-shrink-0" fill="#9ca3af" /> : item.isNote ? <FileText size={20} className="mr-3 text-amber-500 flex-shrink-0" /> : <FileIcon size={20} className="mr-3 text-blue-500 flex-shrink-0" />}
                                                <div className="min-w-0">
                                                    <div className="font-medium text-sm text-gray-900 truncate">{item.isFolder ? item.name : item.original_filename}</div>
                                                    {item.isNote && item.content_plaintext && (
                                                        <div className="text-xs text-gray-400 truncate max-w-xs">{item.content_plaintext}</div>
                                                    )}
                                                </div>
                                                {item.isFolder && item.is_private && <Lock size={14} className="ml-2 text-red-500 flex-shrink-0" title="Private folder" />}
                                            </td>
                                            {isSearching && (
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{item.path}</td>
                                            )}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {item.isFolder ? 'Folder' : item.isNote ? 'Note' : (item.file_type === 'image' ? 'Image' : item.file_type === 'video' ? 'Video' : 'File')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {item.isNote ? '—' : formatBytes(item.size_bytes)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button 
                                                    className="w-9 h-9 inline-flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition text-xl font-bold" 
                                                    onClick={(e) => { e.stopPropagation(); handleContextMenu(e, item); }}
                                                    title="More actions"
                                                >
                                                    ⋮
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {items.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                            {isSearching ? (
                                <>
                                    <SearchX size={64} className="mb-4 text-gray-300" />
                                    <p className="text-lg font-medium text-gray-600">No results found</p>
                                    <p className="text-sm">Try a different search term</p>
                                </>
                            ) : (
                                <>
                                    <Folder size={64} className="mb-4 text-gray-300" />
                                    <p className="text-lg font-medium text-gray-600">This folder is empty</p>
                                    <p className="text-sm">Drag and drop files here to upload</p>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <UploadTray uploads={uploads} setUploads={setUploads} />
            <PasteUploadQueue onUpload={handleUploadFiles} />

            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    item={contextMenu.item}
                    onClose={() => setContextMenu(null)}
                    onAction={onContextMenuAction}
                    canModify={isMaster}
                />
            )}

            <NewFolderModal
                isOpen={folderModal.isOpen}
                initialName={folderModal.initialName}
                showPrivateToggle={isMaster && folderModal.mode === 'create'}
                onClose={() => setFolderModal({ isOpen: false })}
                onSubmit={folderModal.mode === 'create' ? handleCreateFolder : handleRename}
            />

            <MoveModal
                isOpen={moveModal.isOpen}
                item={moveModal.item}
                onClose={() => setMoveModal({ isOpen: false, item: null })}
                onMove={handleMove}
            />

            <PreviewModal
                item={previewItem}
                allItems={items}
                onClose={() => setPreviewItem(null)}
                onDownload={handleDownload}
                onCopy={handleCopyImage}
            />

            <NoteEditorModal
                noteId={openNoteId}
                isMaster={isMaster}
                onClose={() => setOpenNoteId(null)}
                onSaved={refreshView}
            />

            {infoModalOpen && <FolderInfoModal folder={folderData?.folder} onClose={() => setInfoModalOpen(false)} />}

            {isMaster && (
                <LogsModal isOpen={logsModalOpen} onClose={() => setLogsModalOpen(false)} />
            )}
        </div>
    );
}

export default function DrivePage() {
    return (
        <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-500">Loading...</div>}>
            <DriveContent />
        </Suspense>
    );
}

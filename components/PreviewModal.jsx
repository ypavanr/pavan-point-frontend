import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, File as FileIcon, Copy } from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';
import api from '@/lib/api';

const MIN_SCALE = 1;
const MAX_SCALE = 5;

export default function PreviewModal({ item, allItems, onClose, onDownload, onCopy }) {
    // All hooks must run unconditionally on every render (Rules of Hooks) -
    // the early "if (!item) return null" below must come after every hook call,
    // otherwise the hook count changes between the modal-closed and modal-open
    // renders and React throws/corrupts state.
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [openItemId, setOpenItemId] = useState(null);
    const [blobUrl, setBlobUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scale, setScale] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragState = useRef(null);
    const imgRef = useRef(null);

    const filesOnly = allItems.filter((i) => !i.isFolder);

    // Reset the navigation index whenever a *new* item is opened (not on every
    // render) - adjusting state during render, per React's docs, instead of a
    // useEffect, since this is derived from props rather than an external system.
    if (item && item.id !== openItemId) {
        setOpenItemId(item.id);
        setCurrentIndex(filesOnly.findIndex((i) => i.id === item.id));
    }

    const currentItem = currentIndex >= 0 ? filesOnly[currentIndex] : item;

    const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : '';

    useEffect(() => {
        if (!currentItem) return undefined;
        let objectUrl = null;
        let isSubscribed = true;
        setLoading(true);
        setScale(1);
        setPan({ x: 0, y: 0 });

        if (currentItem.file_type === 'image') {
            api.get(`/api/files/${currentItem.id}/preview`, { responseType: 'blob' })
                .then((res) => {
                    objectUrl = URL.createObjectURL(res.data);
                    if (isSubscribed) {
                        setBlobUrl(objectUrl);
                        setLoading(false);
                    }
                })
                .catch(() => setLoading(false));
        } else {
            setBlobUrl(`${api.defaults.baseURL}/api/files/${currentItem.id}/preview?token=${token}`);
            setLoading(false);
        }

        return () => {
            isSubscribed = false;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
        // Intentionally narrowed to the fields that actually affect the fetch,
        // not the whole currentItem object (which is a new reference every render).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentItem?.id, currentItem?.file_type, token]);

    const handlePrev = useCallback(() => {
        setCurrentIndex((i) => (i > 0 ? i - 1 : i));
    }, []);

    const handleNext = useCallback(() => {
        setCurrentIndex((i) => (i < filesOnly.length - 1 ? i + 1 : i));
    }, [filesOnly.length]);

    useEffect(() => {
        if (!item) return undefined;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
            else if (e.key === 'ArrowLeft') handlePrev();
            else if (e.key === 'ArrowRight') handleNext();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [item, onClose, handlePrev, handleNext]);

    const zoomBy = (delta) => {
        setScale((s) => {
            const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, s + delta));
            if (next === MIN_SCALE) setPan({ x: 0, y: 0 });
            return next;
        });
    };

    // React attaches wheel listeners as passive by default, which silently
    // ignores preventDefault(). Attach natively so scroll-to-zoom actually
    // stops the browser's own scroll/zoom behavior.
    useEffect(() => {
        const el = imgRef.current;
        if (!el) return undefined;
        const onWheel = (e) => {
            e.preventDefault();
            zoomBy(e.deltaY < 0 ? 0.25 : -0.25);
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, [loading, currentItem?.file_type]);

    const handleDoubleClick = () => {
        if (currentItem?.file_type !== 'image') return;
        setScale((s) => (s > MIN_SCALE ? MIN_SCALE : 2.5));
        setPan({ x: 0, y: 0 });
    };

    const handleMouseDown = (e) => {
        if (scale <= MIN_SCALE || currentItem?.file_type !== 'image') return;
        dragState.current = { startX: e.clientX - pan.x, startY: e.clientY - pan.y };
        setIsDragging(true);
    };

    const handleMouseMove = (e) => {
        if (!dragState.current) return;
        setPan({ x: e.clientX - dragState.current.startX, y: e.clientY - dragState.current.startY });
    };

    const handleMouseUp = () => {
        dragState.current = null;
        setIsDragging(false);
    };

    if (!item || !currentItem) return null;

    return (
        <div className="fixed inset-0 bg-black/90 flex flex-col z-50" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 text-white">
                <div className="truncate flex-1 max-w-xl font-medium">
                    <div>{currentItem.original_filename}</div>
                    <div className="text-xs text-gray-400 font-normal mt-0.5">{currentItem.capture_time}</div>
                </div>
                <div className="flex items-center space-x-2">
                    {currentItem.file_type === 'image' && (
                        <>
                            <button onClick={() => zoomBy(-0.5)} className="p-2 hover:bg-white/20 rounded-full transition" title="Zoom out">
                                <ZoomOut size={20} />
                            </button>
                            <span className="text-sm w-12 text-center select-none">{Math.round(scale * 100)}%</span>
                            <button onClick={() => zoomBy(0.5)} className="p-2 hover:bg-white/20 rounded-full transition" title="Zoom in">
                                <ZoomIn size={20} />
                            </button>
                            <button onClick={() => onCopy(currentItem)} className="p-2 hover:bg-white/20 rounded-full transition" title="Copy Image">
                                <Copy size={20} />
                            </button>
                        </>
                    )}
                    <button onClick={() => onDownload(currentItem)} className="p-2 hover:bg-white/20 rounded-full transition" title="Download">
                        <Download size={24} />
                    </button>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition" title="Close">
                        <X size={24} />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center relative px-16 pb-4 overflow-hidden">
                {currentIndex > 0 && (
                    <button onClick={handlePrev} className="absolute left-4 p-3 text-white hover:bg-white/20 rounded-full transition z-10">
                        <ChevronLeft size={32} />
                    </button>
                )}

                {loading ? (
                    <div className="text-white">Loading...</div>
                ) : currentItem.file_type === 'image' ? (
                    <img
                        ref={imgRef}
                        src={blobUrl}
                        alt={currentItem.original_filename}
                        draggable={false}
                        onDoubleClick={handleDoubleClick}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        className="max-w-full max-h-full object-contain select-none"
                        style={{
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                            cursor: scale > MIN_SCALE ? 'grab' : 'zoom-in',
                            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                        }}
                    />
                ) : currentItem.file_type === 'video' ? (
                    <video src={blobUrl} controls className="max-w-full max-h-full" autoPlay />
                ) : (
                    <div className="flex flex-col items-center justify-center text-white">
                        <FileIcon size={80} className="mb-4 text-gray-400" />
                        <p className="text-xl font-medium mb-2">Preview not available</p>
                        <p className="text-gray-400 mb-6 text-center max-w-sm">This file type cannot be previewed in the browser.</p>
                        <button onClick={() => onDownload(currentItem)} className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition font-medium">
                            <Download size={20} className="mr-2" /> Download File
                        </button>
                    </div>
                )}

                {currentIndex < filesOnly.length - 1 && (
                    <button onClick={handleNext} className="absolute right-4 p-3 text-white hover:bg-white/20 rounded-full transition z-10">
                        <ChevronRight size={32} />
                    </button>
                )}
            </div>
        </div>
    );
}

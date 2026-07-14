"use client";

import { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message) => {
        const id = crypto.randomUUID();
        setToasts((prev) => [...prev, { id, message }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3500);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center space-y-2">
                {toasts.map((t) => (
                    <div key={t.id} className="flex items-center bg-gray-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">
                        <AlertCircle size={16} className="mr-2 text-red-400 flex-shrink-0" />
                        {t.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export const useToast = () => useContext(ToastContext);

// Turns an axios error into a readable message, defaulting to a clean
// permission-denied notice for 403s so blocked actions never look like a crash.
export function errorMessage(error, fallback) {
    if (error?.response?.status === 403) return "You don't have permission to do that.";
    return error?.response?.data?.detail || fallback;
}

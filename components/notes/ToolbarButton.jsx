"use client";

import clsx from 'clsx';

export default function ToolbarButton({ onClick, isActive, disabled, title, children }) {
    return (
        <button
            type="button"
            onMouseDown={(e) => e.preventDefault()} // don't steal focus/selection from the editor
            onClick={onClick}
            disabled={disabled}
            title={title}
            aria-pressed={!!isActive}
            className={clsx(
                "p-2 rounded-md hover:bg-gray-100 transition disabled:opacity-30 disabled:hover:bg-transparent",
                isActive ? "bg-blue-100 text-blue-700" : "text-gray-600"
            )}
        >
            {children}
        </button>
    );
}

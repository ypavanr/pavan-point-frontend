"use client";

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import clsx from 'clsx';

export default function LoginPage() {
    const [role, setRole] = useState('viewer');
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await login(role, password, displayName.trim());
        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid credentials');
        }
    };

    return (
        <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
            <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg border border-gray-100">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-semibold text-gray-900">Sign in</h1>
                    <p className="text-gray-500 mt-2">to continue to Drive</p>
                </div>

                <div className="grid grid-cols-2 gap-1 p-1 mb-6 bg-gray-100 rounded-lg">
                    <button
                        type="button"
                        onClick={() => { setRole('master'); setError(''); }}
                        className={clsx(
                            "py-2 text-sm font-medium rounded-md transition",
                            role === 'master' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        Master
                    </button>
                    <button
                        type="button"
                        onClick={() => { setRole('viewer'); setError(''); }}
                        className={clsx(
                            "py-2 text-sm font-medium rounded-md transition",
                            role === 'viewer' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        Viewer
                    </button>
                </div>

                {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {role === 'viewer' && (
                        <div>
                            <input
                                type="text"
                                placeholder="Your name"
                                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                maxLength={50}
                                required
                            />
                        </div>
                    )}
                    <div>
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition"
                    >
                        Sign in as {role === 'master' ? 'Master' : 'Viewer'}
                    </button>
                </form>
            </div>
        </div>
    );
}

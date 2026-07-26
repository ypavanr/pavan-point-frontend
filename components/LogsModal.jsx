import { X, History } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function LogsModal({ isOpen, onClose }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setLoading(true);
        api.get('/api/auth/viewer-logs')
            .then((res) => setLogs(res.data))
            .catch(() => setLogs([]))
            .finally(() => setLoading(false));
    }, [isOpen]);

    if (!isOpen) return null;

    const formatDate = (iso) => new Date(iso).toLocaleString();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[70vh] flex flex-col overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 flex-shrink-0">
                    <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                        <History size={22} className="mr-3 text-blue-500" />
                        Viewer Login History
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition rounded-full p-1 hover:bg-gray-100">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="text-center text-gray-400 py-8 text-sm">Loading...</div>
                    ) : logs.length === 0 ? (
                        <div className="text-center text-gray-400 py-8 text-sm">No viewer logins yet</div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP address</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logged in at</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {logs.map((log, i) => (
                                    <tr key={i}>
                                        <td className="px-6 py-3 text-sm font-medium text-gray-800">{log.username}</td>
                                        <td className="px-6 py-3 text-sm text-gray-500 font-mono">{log.ip_address || '—'}</td>
                                        <td className="px-6 py-3 text-sm text-gray-500">{formatDate(log.logged_in_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

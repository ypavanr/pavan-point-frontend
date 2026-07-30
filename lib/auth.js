"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from './api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null); // { username, role }
    const router = useRouter();

    useEffect(() => {
        const token = sessionStorage.getItem('token');
        if (!token) {
            setIsAuthenticated(false);
            setIsLoading(false);
            if (window.location.pathname !== '/login') {
                router.push('/login');
            }
            return;
        }

        api.get('/api/auth/me')
            .then((res) => {
                setUser(res.data);
                setIsAuthenticated(true);
            })
            .catch(() => {
                sessionStorage.removeItem('token');
                setIsAuthenticated(false);
                if (window.location.pathname !== '/login') {
                    router.push('/login');
                }
            })
            .finally(() => setIsLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Master is always "me" - no username. Viewer has no account either, just a
    // shared password; displayName is a freeform label chosen at login time
    // purely for identification (shown in the master's login history).
    const login = async (role, password, displayName) => {
        const response = await api.post('/api/auth/login', {
            role,
            password,
            ...(role === 'viewer' ? { display_name: displayName } : {}),
        });
        const { access_token } = response.data;
        sessionStorage.setItem('token', access_token);

        const me = await api.get('/api/auth/me');
        setUser(me.data);
        setIsAuthenticated(true);
        router.push('/');
    };

    const logout = () => {
        sessionStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, user, isMaster: user?.role === 'master' || user?.role === 'peepee', login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);

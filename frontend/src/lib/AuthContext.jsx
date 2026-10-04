import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '@/lib/api';

const AuthContext = createContext();

// ΓöÇΓöÇΓöÇ Default User ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export const DEMO_USER = {
    id: 'user-1',
    email: 'fleet@qflow.app',
    full_name: 'Fleet Officer',
    role: 'admin',
};

const DEMO_TOKEN_KEY = 'demo_auth_token';
const DEMO_USER_KEY = 'demo_auth_user';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
    const [authError, setAuthError] = useState(null);
    const [authChecked, setAuthChecked] = useState(false);
    const [appPublicSettings] = useState({ id: 'demo', public_settings: {} });

    // On mount, restore session if available or prepare demo state
    useEffect(() => {
        const syncBackendSession = async () => {
        try {
            const backend = await api.getAuthSession();
            if (backend.authenticated && backend.user) {
                setUser(backend.user);
                setIsAuthenticated(true);
                return;
            }
            const token = sessionStorage.getItem(DEMO_TOKEN_KEY) || localStorage.getItem(DEMO_TOKEN_KEY);
            const savedUser = sessionStorage.getItem(DEMO_USER_KEY) || localStorage.getItem(DEMO_USER_KEY);
            if (token) {
                setUser(savedUser ? JSON.parse(savedUser) : DEMO_USER);
                setIsAuthenticated(true);
            }
        } catch (e) {
            console.warn('Error reading stored session', e);
        } finally {
            setIsLoadingAuth(false);
            setAuthChecked(true);
        }
        };
        syncBackendSession();
    }, []);

    const loginDemo = (customDetails) => {
        const sessionUser = customDetails?.email ? {
            id: 'user-' + Date.now(),
            email: customDetails.email,
            full_name: customDetails.full_name || customDetails.email.split('@')[0],
            role: 'admin',
        } : DEMO_USER;

        try {
            api.logoutSession().catch(() => {});
            sessionStorage.setItem(DEMO_TOKEN_KEY, 'demo');
            localStorage.setItem(DEMO_TOKEN_KEY, 'demo');
            sessionStorage.setItem(DEMO_USER_KEY, JSON.stringify(sessionUser));
            localStorage.setItem(DEMO_USER_KEY, JSON.stringify(sessionUser));
        } catch (e) {
            console.warn('Could not persist session', e);
        }

        setUser(sessionUser);
        setIsAuthenticated(true);
        setAuthError(null);
        return sessionUser;
    };

    const logout = () => {
        try {
            sessionStorage.removeItem(DEMO_TOKEN_KEY);
            localStorage.removeItem(DEMO_TOKEN_KEY);
            sessionStorage.removeItem(DEMO_USER_KEY);
            localStorage.removeItem(DEMO_USER_KEY);
        } catch (e) {
            console.warn('Could not clear session', e);
        }
        setUser(null);
        setIsAuthenticated(false);
        window.location.href = '/';
    };

    const navigateToLogin = () => {
        window.location.href = '/login';
    };

    const checkUserAuth = () => {
        const token = sessionStorage.getItem(DEMO_TOKEN_KEY) || localStorage.getItem(DEMO_TOKEN_KEY);
        if (token) {
            const savedUser = sessionStorage.getItem(DEMO_USER_KEY) || localStorage.getItem(DEMO_USER_KEY);
            setUser(savedUser ? JSON.parse(savedUser) : DEMO_USER);
            setIsAuthenticated(true);
        }
        setAuthChecked(true);
    };

    const checkAppState = () => {
        checkUserAuth();
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated,
            isLoadingAuth,
            isLoadingPublicSettings,
            authError,
            appPublicSettings,
            authChecked,
            logout,
            navigateToLogin,
            checkUserAuth,
            checkAppState,
            loginDemo,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

interface UserProfile {
    id: string;
    email: string;
    full_name?: string;
    role?: string;
    [key: string]: any;
}

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshSession: () => Promise<Session | null | undefined>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Helper to fetch profile
    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.warn('⚠️ Auth: Profile fetch issue:', error.message);
            } else {
                setProfile(data);
            }
        } catch (err) {
            console.error('❌ Auth: Profile exception:', err);
        }
    };

    useEffect(() => {
        let mounted = true;

        // Safety fallback: Force loading to false after 3s to prevent infinite spinner
        const timeoutId = setTimeout(() => {
            if (mounted && loading) {
                console.warn('⚠️ Auth: Safety timeout triggered');
                setLoading(false);
            }
        }, 3000);

        // 1. Setup Listener FIRST (Single Source of Truth)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            if (!mounted) return;
            console.log(`🔔 Auth Event: ${event}`, { userId: currentSession?.user?.id });

            // CRITICAL PRODUCTION FIX: Clear hash after successful login/refresh
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                // Safely clear hash without reload
                if (window.location.hash && (window.location.hash.includes('access_token') || window.location.hash.includes('type=recovery'))) {
                    window.history.replaceState(null, '', window.location.pathname);
                }
            }

            if (currentSession?.user) {
                setSession(currentSession);
                setUser(currentSession.user);

                // CRITICAL: Set loading false first, then fetch profile in background
                // This prevents "stuck loading" if profile fetch hangs/fails
                setLoading(false);
                await fetchProfile(currentSession.user.id);
            } else {
                setSession(null);
                setUser(null);
                setProfile(null);
                setLoading(false);
            }
        });

        // 2. Initial Session Check (Fire and Forget)
        supabase.auth.getSession().then(({ data, error }) => {
            if (!mounted) return;
            if (error && !error.message.includes('stale')) {
                console.error('❌ Auth: Session init error', error);
            }
            if (data.session) {
                setSession(data.session);
                setUser(data.session.user);
                // Background fetch
                fetchProfile(data.session.user.id);
            }
            setLoading(false);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
            clearTimeout(timeoutId);
        };
    }, []);

    const signOut = async () => {
        try {
            // Optimistic Cleanup
            setSession(null);
            setUser(null);
            setProfile(null);

            // Clear modular tokens
            localStorage.removeItem('ganges_token');
            localStorage.removeItem('ganges_refresh_token');
            localStorage.removeItem('user');

            // Perform Supabase SignOut
            await supabase.auth.signOut();
        } catch (err) {
            console.error('Unexpected error during sign out:', err);
        }
    };

    const refreshSession = async () => {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        // State updates handled by onAuthStateChange listener
        return data.session;
    };

    const value = {
        session,
        user,
        profile,
        loading,
        signOut,
        refreshSession,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

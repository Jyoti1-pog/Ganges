import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface AsyncState<T> {
    data: T | null;
    loading: boolean;
    error: Error | null;
}

export function useAsyncData<T>(
    fetchFn: () => Promise<T>,
    dependencies: any[] = []
): AsyncState<T> & { refetch: () => Promise<void> } {
    const { user } = useAuth();
    const [state, setState] = useState<AsyncState<T>>({
        data: null,
        loading: true,
        error: null,
    });

    const execute = useCallback(async () => {
        // Prevent fetching if auth is not ready (unless generic)
        if (!user) {
            // If strictly requiring auth, we might want to stay loading or just return null
            // But since ProtectedRoute guards us, user SHOULD be here. 
            // If not, we wait.
            return;
        }

        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const result = await fetchFn();
            setState({ data: result, loading: false, error: null });
        } catch (err: any) {
            console.error('Data Fetch Error:', err);
            setState({ data: null, loading: false, error: err });
        }
    }, [user, ...dependencies]);

    useEffect(() => {
        execute();
    }, [execute]);

    return { ...state, refetch: execute };
}

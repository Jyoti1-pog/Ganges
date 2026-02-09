import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { user, loading } = useAuth();
    const location = useLocation();

    // 1. Wait for AuthContext to initialize (loading=true until first event or session check completes)
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        );
    }

    // 2. Deterministic Redirect
    if (!user) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    // 3. Safe Render
    return <>{children}</>;
}

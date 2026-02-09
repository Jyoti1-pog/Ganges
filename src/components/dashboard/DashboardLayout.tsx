import React, { useEffect, useState } from 'react';
import {
    LayoutDashboard,
    MapPin,
    Package,
    Truck,
    ShoppingBag,
    Calculator,
    Wallet,
    HelpCircle,
    LogOut,
    Menu,
    X,
    User as UserIcon
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const { user, signOut } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // Close sidebar on route change (Mobile UX fix)
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location.pathname]);

    const menuItems = [
        { title: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { title: 'My Virtual Address', icon: MapPin, path: '/dashboard/address' },
        { title: 'Locker / Inventory', icon: Package, path: '/dashboard/locker' },
        { title: 'Shipments', icon: Truck, path: '/dashboard/shipments' },
        { title: 'Personal Shopper', icon: ShoppingBag, path: '/dashboard/shopper' },
        { title: 'Shipping Calculator', icon: Calculator, path: '/dashboard/calculator' },
        { title: 'Wallet', icon: Wallet, path: '/dashboard/wallet' },
        { title: 'Support & FAQs', icon: HelpCircle, path: '/dashboard/support' },
    ];

    const handleLogout = async () => {
        try {
            await signOut();
            navigate('/');
        } catch (error) {
            console.error('Error signing out:', error);
            // Fallback redirect if something goes wrong
            window.location.href = '/';
        } finally {
            setIsSidebarOpen(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar Component - Extracted for cleaner state mgmt */}
            <Sidebar
                open={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onLogout={handleLogout}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Top Header */}
                <header className="h-16 bg-white border-b flex items-center justify-between px-6 lg:px-8 shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100"
                            onClick={() => setIsSidebarOpen(true)}
                            aria-label="Open sidebar"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <h2 className="text-lg font-bold text-gray-800 lg:hidden">Ganges Dashboard</h2>
                        <div className="hidden lg:block">
                            <p className="text-sm text-gray-500 font-medium">Namaste,</p>
                            <p className="text-lg font-bold text-gray-900 leading-none">Welcome to your dashboard</p>
                        </div>
                    </div>

                    {/* Right Header Actions */}
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex flex-col items-end">
                            <p className="text-xs text-gray-400">Wallet Balance</p>
                            <p className="text-sm font-bold text-green-600">
                                {user?.user_metadata?.wallet_balance !== undefined
                                    ? `₹${user.user_metadata.wallet_balance.toFixed(2)}`
                                    : '₹0.00'}
                            </p>
                        </div>
                        <Button variant="outline" size="sm" className="hidden sm:flex" asChild>
                            <Link to="/dashboard/wallet">+ Add Funds</Link>
                        </Button>
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center border-2 border-white shadow-sm">
                            <UserIcon className="w-4 h-4 text-blue-600" />
                        </div>
                    </div>
                </header>

                {/* Content Viewport */}
                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto h-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

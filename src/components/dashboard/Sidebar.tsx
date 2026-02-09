import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, MapPin, Package, Truck, ShoppingBag, Calculator, Wallet, HelpCircle, LogOut, X, User as UserIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
    open: boolean;
    onClose: () => void;
    onLogout: () => void;
}

export function Sidebar({ open, onClose, onLogout }: SidebarProps) {
    const { user } = useAuth();
    const location = useLocation();

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

    // Debug handler to verify click
    const handleClose = () => {
        console.log('❌ Sidebar: Close button clicked');
        onClose();
    };

    return (
        <>
            {/* Mobile Overlay - Should be OUTSIDE the transform container if possible, 
                but keeping structure simple. z-40 below sidebar (z-50) */}
            {open && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={handleClose}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar Content */}
            <aside className={cn(
                "fixed inset-y-0 left-0 w-64 bg-white border-r z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:block shadow-xl lg:shadow-none",
                open ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="h-full flex flex-col relative z-50 bg-white">
                    {/* Header / Logo / Close Button */}
                    <div className="p-6 border-b flex items-center justify-between">
                        <Link to="/" className="flex items-center gap-2" onClick={handleClose}>
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold">G</span>
                            </div>
                            <span className="text-xl font-bold">Ganges</span>
                        </Link>

                        {/* 
                            CLOSE BUTTON
                            - No wrappers
                            - No pointer-events: none on button
                            - Explicit onClick
                            - Higher z-index just in case
                        */}
                        <button
                            type="button"
                            className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 cursor-pointer relative z-50"
                            onClick={(e) => {
                                e.stopPropagation(); // Stop bubbling just in case
                                handleClose();
                            }}
                            aria-label="Close sidebar"
                        >
                            <X className="w-6 h-6 pointer-events-none" />
                        </button>
                    </div>

                    {/* User Profile */}
                    <div className="p-4 border-b">
                        <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-xl">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <UserIcon className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-medium truncate">{user?.email}</p>
                                <p className="text-xs text-blue-600 font-semibold">GANGES-ID: {user?.id.substring(0, 8).toUpperCase()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={handleClose}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer",
                                        isActive
                                            ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                    )}
                                >
                                    <item.icon className="w-5 h-5 flex-shrink-0 pointer-events-none" />
                                    <span className="font-medium text-sm pointer-events-none">{item.title}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer / Logout */}
                    <div className="p-4 border-t mt-auto">
                        <button
                            type="button"
                            onClick={() => {
                                onLogout();
                                handleClose();
                            }}
                            className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                        >
                            <LogOut className="w-5 h-5 pointer-events-none" />
                            <span className="font-medium text-sm pointer-events-none">Sign Out</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}

import { useEffect, useState } from 'react';
import {
    Package,
    Truck,
    Wallet,
    Clock,
    ChevronRight,
    TrendingUp,
    AlertCircle
} from 'lucide-react';
import { Button } from '../ui/button';
import { Link } from 'react-router-dom';
import apiService from '@/services/api.service';
import { useAuth } from '@/contexts/AuthContext';

export function DashboardHome() {
    const { user } = useAuth();
    const [stats, setStats] = useState([
        { title: 'Active Packages', value: '0', icon: Package, color: 'text-blue-600', bg: 'bg-blue-100' },
        { title: 'In Transit', value: '0', icon: Truck, color: 'text-orange-600', bg: 'bg-orange-100' },
        { title: 'Wallet Balance', value: '₹0.00', icon: Wallet, color: 'text-green-600', bg: 'bg-green-100' },
        { title: 'Last Order', value: 'None', icon: Clock, color: 'text-purple-600', bg: 'bg-purple-100' },
    ]);
    const [loading, setLoading] = useState(true);

    // Safe Data Fetching Pattern
    useEffect(() => {
        let mounted = true;

        const fetchStats = async () => {
            if (!user) return;

            setLoading(true);
            try {
                // Use the consolidated modular backend dashboard endpoint
                const data = await apiService.dashboard.getCustomerDashboard();

                if (mounted) {
                    const { activeShipments, recentShipments, totalSpent } = data;

                    setStats([
                        { title: 'Active Packages', value: activeShipments.length.toString(), icon: Package, color: 'text-blue-600', bg: 'bg-blue-100' },
                        { title: 'In Transit', value: activeShipments.filter((s: any) => s.status === 'IN_TRANSIT').length.toString(), icon: Truck, color: 'text-orange-600', bg: 'bg-orange-100' },
                        { title: 'Wallet Balance', value: `₹${totalSpent.toFixed(2)}`, icon: Wallet, color: 'text-green-600', bg: 'bg-green-100' },
                        { title: 'Last Order', value: recentShipments.length > 0 ? new Date(recentShipments[0].createdAt).toLocaleDateString() : 'None', icon: Clock, color: 'text-purple-600', bg: 'bg-purple-100' },
                    ]);
                }
            } catch (error) {
                console.error('Failed to load dashboard stats:', error);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchStats();

        return () => {
            mounted = false;
        };
    }, [user]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold mb-2">Welcome Back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(' ')[0]}` : ''}!</h1>
                    <p className="text-blue-100 max-w-lg mb-6">
                        Your bridge to shopping from Indian stores. Use your virtual address to start shopping today.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <Button className="bg-white text-blue-600 hover:bg-blue-50 border-none px-6" asChild>
                            <Link to="/dashboard/address">View My Address <ChevronRight className="ml-2 w-4 h-4" /></Link>
                        </Button>
                        <Button variant="outline" className="text-white border-white/30 hover:bg-white/10" asChild>
                            <Link to="/dashboard/shopper">Personal Shopper</Link>
                        </Button>
                    </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-1/4 -translate-y-1/4">
                    <TrendingUp className="w-64 h-64" />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`${stat.bg} p-3 rounded-xl group-hover:scale-110 transition-transform`}>
                                <stat.icon className={`${stat.color} w-6 h-6`} />
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300" />
                        </div>
                        <p className="text-sm text-gray-500 font-medium mb-1">{stat.title}</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {loading ? <span className="animate-pulse bg-gray-200 h-8 w-16 block rounded"></span> : stat.value}
                        </p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 font-bold">See All</Button>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center p-12 text-center text-gray-500">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Package className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="font-medium text-gray-900 mb-1">No recent activity</p>
                        <p className="text-sm max-w-xs">Start by sharing your virtual address with your favorite Indian sellers.</p>
                    </div>
                </div>

                {/* Important Notifications */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-gray-900">Quick Alerts</h3>
                    <div className="space-y-4">
                        <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-4">
                            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-amber-900 mb-1">Verify Your Account</p>
                                <p className="text-xs text-amber-700">Complete your profile to enable international shipping.</p>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex gap-4">
                            <TrendingUp className="w-5 h-5 text-blue-600 shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-blue-900 mb-1">New Route Alert</p>
                                <p className="text-xs text-blue-700">Economy shipping to USA now available from ₹999/kg.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

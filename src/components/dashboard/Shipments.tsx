import { useEffect, useState } from 'react';
import {
    Truck,
    Search,
    Plus,
    Clock,
    ExternalLink,
    MapPin,
    Package
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import apiService from '@/services/api.service';
import { Badge } from '@/components/ui/badge';
import { ErrorBanner } from '@/components/ui/error-banner';

export function Shipments() {
    const [searchTerm, setSearchTerm] = useState('');
    const [shipments, setShipments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All Shipments');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        loadShipments(mounted);
        return () => { mounted = false; };
    }, []);

    const loadShipments = async (mounted = true) => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiService.shipment.getShipments();
            if (mounted) setShipments(data || []);
        } catch (error: any) {
            console.error('Failed to load shipments:', error);
            if (mounted) {
                setShipments([]);
                setError(error.message || "Failed to load shipments");
            }
        } finally {
            if (mounted) setLoading(false);
        }
    };

    // Wrapper for retry button
    const handleRetry = () => loadShipments(true);

    const filteredShipments = shipments.filter(shipment => {
        const matchesSearch = shipment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            shipment.destination_address?.city?.toLowerCase().includes(searchTerm.toLowerCase());

        if (filter === 'All Shipments') return matchesSearch;
        if (filter === 'Active') return matchesSearch && !['Delivered', 'Canceled'].includes(shipment.status);
        if (filter === 'Completed') return matchesSearch && shipment.status === 'Delivered';
        if (filter === 'Canceled') return matchesSearch && shipment.status === 'Canceled';

        return matchesSearch;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            case 'Processing': return 'bg-blue-100 text-blue-800';
            case 'Shipped': return 'bg-purple-100 text-purple-800';
            case 'In Transit': return 'bg-indigo-100 text-indigo-800';
            case 'Delivered': return 'bg-green-100 text-green-800';
            case 'Canceled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Shipments</h1>
                    <p className="text-gray-500 font-medium">Track your outgoing international shipments.</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 font-bold px-6">
                    <Plus className="mr-2 w-4 h-4" /> New Shipment
                </Button>
            </div>

            {/* Filters/Tabs */}
            <div className="flex flex-wrap gap-4">
                {['All Shipments', 'Active', 'Completed', 'Canceled'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${filter === tab ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-gray-500 border border-gray-100'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Main Table Container */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden min-h-[500px]">
                {/* Table Toolbar */}
                <div className="p-6 border-b flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search by ID or Location..."
                            className="pl-10 bg-white border-gray-200 rounded-xl"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="rounded-xl font-bold text-gray-600 h-10 px-4">
                            Export to PDF
                        </Button>
                    </div>
                </div>

                {/* Dynamic List */}
                {loading ? (
                    <div className="p-12 flex flex-col items-center justify-center text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                        <p className="text-gray-500">Loading shipments...</p>
                    </div>
                ) : error ? (
                    <div className="p-8">
                        <ErrorBanner message={error} onRetry={handleRetry} />
                    </div>
                ) : filteredShipments.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Shipment ID</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Destination</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Est. Arrival</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredShipments.map((shipment) => (
                                    <tr key={shipment.id} className="hover:bg-blue-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                                    <Truck className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-bold text-gray-900">#{shipment.id.substring(0, 8).toUpperCase()}</div>
                                                    <div className="text-xs text-gray-500">{shipment.shipping_method}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm text-gray-900">
                                                <MapPin className="mr-1.5 h-4 w-4 text-gray-400" />
                                                {shipment.destination_address?.city || 'Unknown City'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${getStatusColor(shipment.status)}`}>
                                                {shipment.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(shipment.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                                            {shipment.estimated_delivery ? new Date(shipment.estimated_delivery).toLocaleDateString() : 'TBD'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Button variant="ghost" className="text-blue-600 hover:text-blue-900 font-bold">
                                                View <ExternalLink className="ml-1 w-3 h-3" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-6">
                            <Truck className="w-12 h-12 text-orange-200" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No {filter !== 'All Shipments' ? filter : ''} Shipments</h3>
                        <p className="text-gray-500 max-w-sm mx-auto mb-8">
                            You haven't made any international shipments yet. When you consolidate items from your locker, they will appear here.
                        </p>
                        <div className="flex flex-wrap gap-4 justify-center">
                            <Button className="bg-blue-600 hover:bg-blue-700 font-bold rounded-2xl px-8 h-14 shadow-lg shadow-blue-100">
                                Consolidate Items
                            </Button>
                            <Button variant="outline" className="font-bold border-2 rounded-2xl px-8 h-14 border-gray-100 text-gray-600 hover:bg-gray-50">
                                Track Existing
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Features/Promotion */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 text-white flex flex-col justify-between">
                    <div className="space-y-4">
                        <h4 className="text-2xl font-bold">Consolidation Magic</h4>
                        <p className="text-indigo-50 text-sm leading-relaxed opacity-90">
                            Combined multiple orders into a single shipment? Our consolidation service reduces total shipping costs by up to 80%!
                        </p>
                    </div>
                    <Button className="w-fit bg-white text-indigo-600 hover:bg-white/90 mt-8 font-bold border-none">
                        How we save you money <ExternalLink className="ml-2 w-4 h-4" />
                    </Button>
                </div>

                <div className="bg-white border border-gray-100 shadow-xl rounded-3xl p-8 space-y-4">
                    <h4 className="text-xl font-bold text-gray-900">Live Support</h4>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        Need help with a shipment or custom duties? Our logistics experts are available 24/7.
                    </p>
                    <div className="flex gap-4 pt-4">
                        <div className="flex -space-x-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`w-10 h-10 rounded-full border-2 border-white bg-blue-${i * 100} flex items-center justify-center`}>
                                    <Clock className="w-4 h-4 text-white opacity-40" />
                                </div>
                            ))}
                        </div>
                        <div className="text-xs text-gray-400 font-medium">
                            <p className="text-gray-700 font-bold">Logistics Hub Online</p>
                            <p>Current wait time: ~5 mins</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

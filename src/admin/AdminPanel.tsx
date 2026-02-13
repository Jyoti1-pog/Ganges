import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import logo from 'figma:asset/35424f6f7581dcd0957679d7cd3c9d5bfc8f9f2a.png';

import {
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  CheckCircle,
  ArrowLeft,
  Send,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

interface AdminPanelProps {
  onBackToHome?: () => void;
  onLogout?: () => void;
}

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  country?: string;
  wallet_balance: number;
  referral_code: string;
  created_at: string;
}

interface Package {
  id: string;
  user_id: string;
  tracking_number: string;
  description?: string;
  weight_kg: number;
  declared_value: number;
  status: string;
  shipping_method: string;
  destination_address?: string;
  created_at: string;
}

interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  created_at: string;
}

interface PersonalShopperRequest {
  id: string;
  user_id: string;
  product_url: string;
  product_name: string;
  quantity: number;
  size?: string;
  color?: string;
  notes?: string;
  status: string;
  created_at: string;
}

export function AdminPanel({ onBackToHome, onLogout }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real data from Supabase
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [personalShopperRequests, setPersonalShopperRequests] = useState<PersonalShopperRequest[]>([]);

  // Statistics
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPackages: 0,
    totalRevenue: 0,
    pendingRequests: 0
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch consolidated admin dashboard data
      const dashboardData = await adminService.getDashboardStats();
      const usersData = await adminService.getUsers();
      const shipmentsData = await adminService.getAllShipments();

      setStats({
        totalUsers: usersData.length,
        totalPackages: shipmentsData.length,
        totalRevenue: dashboardData.revenueTrends?.reduce((sum: number, r: any) => sum + r.revenue, 0) || 0,
        pendingRequests: dashboardData.userGrowth?.newUsers || 0
      });

      setUsers(usersData);
      setPackages(shipmentsData.map((s: any) => ({
        id: s.id,
        tracking_number: s.trackingNumber,
        weight_kg: s.weight,
        declared_value: s.value || 0,
        status: s.status,
        shipping_method: s.shippingMethod,
        created_at: s.createdAt,
        user_id: s.userId
      })));

    } catch (err: any) {
      console.error('Admin panel fetch error:', err);
      setError(err.message || 'Failed to load data');
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const updatePackageStatus = async (shipmentId: string, newStatus: string) => {
    try {
      await apiService.shipment.updateStatus(shipmentId, newStatus);
      toast.success('Shipment status updated!');
      fetchAllData();
    } catch (err: any) {
      console.error('Update shipment error:', err);
      toast.error('Failed to update status');
    }
  };

  const updateUserStatus = async (userId: string, isActive: boolean) => {
    try {
      await adminService.updateUserStatus(userId, isActive);
      toast.success(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
      fetchAllData();
    } catch (err: any) {
      console.error('Update user status error:', err);
      toast.error('Failed to update user status');
    }
  };

  const updateRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('personal_shopper_requests')
        .update({ status: newStatus })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Request status updated!');
      fetchAllData(); // Refresh data
    } catch (err: any) {
      console.error('Update request error:', err);
      toast.error('Failed to update request status');
    }
  };

  const approveTransaction = async (transactionId: string) => {
    try {
      // Update transaction status
      const { error: txnError } = await supabase
        .from('transactions')
        .update({ status: 'Completed' })
        .eq('id', transactionId);

      if (txnError) throw txnError;

      // Get transaction details to update wallet
      const transaction = transactions.find(t => t.id === transactionId);
      if (transaction && transaction.type === 'Credit') {
        // Update user wallet balance
        const { data: userData } = await supabase
          .from('user_profiles')
          .select('wallet_balance')
          .eq('id', transaction.user_id)
          .single();

        if (userData) {
          const newBalance = userData.wallet_balance + transaction.amount;
          await supabase
            .from('user_profiles')
            .update({ wallet_balance: newBalance })
            .eq('id', transaction.user_id);
        }
      }

      toast.success('Transaction approved and wallet updated!');
      fetchAllData(); // Refresh data
    } catch (err: any) {
      console.error('Approve transaction error:', err);
      toast.error('Failed to approve transaction');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardContent className="p-8">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl text-center mb-4">Error Loading Admin Panel</h2>
            <p className="text-gray-600 text-center mb-4">{error}</p>
            <div className="flex gap-2">
              <Button onClick={fetchAllData} className="flex-1">
                Try Again
              </Button>
              <Button onClick={onBackToHome} variant="outline" className="flex-1">
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <img src={logo} alt="Ganges Lite" className="h-8" />
            <h1 className="text-2xl">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAllData}
            >
              <RefreshCw className="mr-2" size={16} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onBackToHome}
            >
              <ArrowLeft className="mr-2" size={16} />
              Back to Site
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="users">Users ({stats.totalUsers})</TabsTrigger>
            <TabsTrigger value="packages">Packages ({stats.totalPackages})</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="personal-shopper">
              Personal Shopper ({stats.pendingRequests})
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Users</p>
                        <p className="text-3xl mt-2">{stats.totalUsers}</p>
                      </div>
                      <Users className="text-blue-500" size={40} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Packages</p>
                        <p className="text-3xl mt-2">{stats.totalPackages}</p>
                      </div>
                      <Package className="text-orange-500" size={40} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Revenue</p>
                        <p className="text-3xl mt-2">₹{stats.totalRevenue.toLocaleString()}</p>
                      </div>
                      <DollarSign className="text-green-500" size={40} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Pending Requests</p>
                        <p className="text-3xl mt-2">{stats.pendingRequests}</p>
                      </div>
                      <ShoppingCart className="text-purple-500" size={40} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Recent Users */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {users.slice(0, 5).map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p>{user.full_name}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </div>
                          <Badge>{user.country || 'India'}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Packages */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Packages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {packages.slice(0, 5).map((pkg) => (
                        <div key={pkg.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p>{pkg.tracking_number}</p>
                            <p className="text-sm text-gray-600">{pkg.weight_kg} kg</p>
                          </div>
                          <Badge variant={pkg.status === 'Delivered' ? 'default' : 'secondary'}>
                            {pkg.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Name</th>
                        <th className="text-left p-3">Email</th>
                        <th className="text-left p-3">Phone</th>
                        <th className="text-left p-3">Country</th>
                        <th className="text-left p-3">Wallet</th>
                        <th className="text-left p-3">Referral Code</th>
                        <th className="text-left p-3">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">{user.full_name}</td>
                          <td className="p-3">{user.email}</td>
                          <td className="p-3">{user.phone || 'N/A'}</td>
                          <td className="p-3">{user.country || 'India'}</td>
                          <td className="p-3">₹{user.wallet_balance}</td>
                          <td className="p-3">{user.referral_code}</td>
                          <td className="p-3">{new Date(user.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Packages Tab */}
          <TabsContent value="packages">
            <Card>
              <CardHeader>
                <CardTitle>All Packages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {packages.map((pkg) => {
                    const user = users.find(u => u.id === pkg.user_id);
                    return (
                      <Card key={pkg.id} className="border-2">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                                <div>
                                  <p className="text-sm text-gray-600">Customer</p>
                                  <p>{user?.full_name || 'Unknown'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Tracking Number</p>
                                  <p>{pkg.tracking_number}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Weight</p>
                                  <p>{pkg.weight_kg} kg</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Value</p>
                                  <p>₹{pkg.declared_value}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Method</p>
                                  <p>{pkg.shipping_method}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Created</p>
                                  <p>{new Date(pkg.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-sm text-gray-600">Destination</p>
                                  <p className="text-sm">{pkg.destination_address || 'Not provided'}</p>
                                </div>
                              </div>
                              {pkg.description && (
                                <p className="text-sm text-gray-600 mb-3">
                                  Description: {pkg.description}
                                </p>
                              )}
                              <div className="flex gap-2">
                                <Select
                                  value={pkg.status}
                                  onValueChange={(value: string) => updatePackageStatus(pkg.id, value)}
                                >
                                  <SelectTrigger className="w-48">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Pending">Pending</SelectItem>
                                    <SelectItem value="Warehouse">Warehouse</SelectItem>
                                    <SelectItem value="In Transit">In Transit</SelectItem>
                                    <SelectItem value="Customs">Customs</SelectItem>
                                    <SelectItem value="Out for Delivery">Out for Delivery</SelectItem>
                                    <SelectItem value="Delivered">Delivered</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>All Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions.map((txn) => {
                    const user = users.find(u => u.id === txn.user_id);
                    return (
                      <Card key={txn.id} className="border-2">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <p className="text-sm text-gray-600">Customer</p>
                                  <p>{user?.full_name || 'Unknown'}</p>
                                  <p className="text-xs text-gray-500">{user?.email}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Type</p>
                                  <Badge variant={txn.type === 'Credit' ? 'default' : 'secondary'}>
                                    {txn.type}
                                  </Badge>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Amount</p>
                                  <p className={`text-lg ${txn.type === 'Credit' ? 'text-green-600' : 'text-red-600'}`}>
                                    {txn.type === 'Credit' ? '+' : '-'}₹{txn.amount}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Status</p>
                                  <Badge variant={txn.status === 'Completed' ? 'default' : 'secondary'}>
                                    {txn.status}
                                  </Badge>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-sm text-gray-600">Description</p>
                                  <p className="text-sm">{txn.description}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Date</p>
                                  <p className="text-sm">{new Date(txn.created_at).toLocaleDateString()}</p>
                                </div>
                                <div>
                                  {txn.status === 'Pending' && txn.type === 'Credit' && (
                                    <Button
                                      size="sm"
                                      onClick={() => approveTransaction(txn.id)}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <CheckCircle className="mr-1" size={16} />
                                      Approve & Credit Wallet
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Personal Shopper Tab */}
          <TabsContent value="personal-shopper">
            <Card>
              <CardHeader>
                <CardTitle>Personal Shopper Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {personalShopperRequests.map((request) => {
                    const user = users.find(u => u.id === request.user_id);
                    return (
                      <Card key={request.id} className="border-2">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <p className="text-sm text-gray-600">Customer</p>
                                <p>{user?.full_name || 'Unknown'}</p>
                                <p className="text-xs text-gray-500">{user?.email}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Product</p>
                                <p>{request.product_name}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Quantity</p>
                                <p>{request.quantity}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Date</p>
                                <p>{new Date(request.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {request.size && (
                                <div>
                                  <p className="text-sm text-gray-600">Size</p>
                                  <p>{request.size}</p>
                                </div>
                              )}
                              {request.color && (
                                <div>
                                  <p className="text-sm text-gray-600">Color</p>
                                  <p>{request.color}</p>
                                </div>
                              )}
                            </div>

                            <div>
                              <p className="text-sm text-gray-600 mb-1">Product URL</p>
                              <a
                                href={request.product_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline"
                              >
                                {request.product_url}
                              </a>
                            </div>

                            {request.notes && (
                              <div>
                                <p className="text-sm text-gray-600 mb-1">Notes</p>
                                <p className="text-sm bg-gray-50 p-2 rounded">{request.notes}</p>
                              </div>
                            )}

                            <div className="flex gap-2 items-center">
                              <Select
                                value={request.status}
                                onValueChange={(value: string) => updateRequestStatus(request.id, value)}
                              >
                                <SelectTrigger className="w-48">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Pending">Pending</SelectItem>
                                  <SelectItem value="Processing">Processing</SelectItem>
                                  <SelectItem value="Purchased">Purchased</SelectItem>
                                  <SelectItem value="Completed">Completed</SelectItem>
                                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const message = `Hi ${user?.full_name}, regarding your personal shopper request for ${request.product_name}...`;
                                  const whatsappUrl = `https://wa.me/${user?.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                                  window.open(whatsappUrl, '_blank');
                                }}
                              >
                                <Send className="mr-1" size={16} />
                                Contact via WhatsApp
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {personalShopperRequests.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>No personal shopper requests yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}



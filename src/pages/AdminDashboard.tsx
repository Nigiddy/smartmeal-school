import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Users,
  LogOut,
  Clock,
  Loader2,
  AlertCircle,
  RefreshCw,
  Utensils
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { OrdersService, MenuService, AuthService, apiUtils } from "@/lib/api";

interface OrderData {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  phoneNumber: string;
  transactionId?: string;
  notes?: string;
  orderItems: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    menuItem: {
      id: string;
      name: string;
      description?: string;
      price: number;
      image?: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  category?: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [menuLoading, setMenuLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("orders");

  // Check authentication on mount
  useEffect(() => {
    if (!AuthService.isAuthenticated()) {
      navigate("/admin/login");
      return;
    }
    
    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await Promise.all([
        fetchOrders(),
        fetchMenuItems()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const response = await OrdersService.getOrders(1, 50);
      setOrders(response.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load orders',
        variant: 'destructive'
      });
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      setMenuLoading(true);
      const items = await MenuService.getMenuItems();
      setMenuItems(items);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load menu items',
        variant: 'destructive'
      });
    } finally {
      setMenuLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      navigate("/admin/login");
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderData['status']) => {
    try {
      await OrdersService.updateOrderStatus(orderId, newStatus);
      
      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      
      toast({
        title: "Order updated",
        description: `Order status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Update failed",
        description: "Failed to update order status",
        variant: "destructive"
      });
    }
  };

  const getStatusBadgeVariant = (status: OrderData['status']) => {
    switch (status) {
      case 'PENDING': return 'secondary';
      case 'CONFIRMED': return 'default';
      case 'PREPARING': return 'default';
      case 'READY': return 'default';
      case 'COMPLETED': return 'default';
      case 'CANCELLED': return 'destructive';
      default: return 'secondary';
    }
  };

  const getPaymentStatusBadgeVariant = (status: OrderData['paymentStatus']) => {
    switch (status) {
      case 'PENDING': return 'secondary';
      case 'PROCESSING': return 'default';
      case 'COMPLETED': return 'default';
      case 'FAILED': return 'destructive';
      case 'CANCELLED': return 'destructive';
      default: return 'secondary';
    }
  };

  const filteredOrders = orders.filter(order =>
    order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDashboardStats = () => {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
    const completedOrders = orders.filter(o => o.status === 'COMPLETED').length;
    const totalRevenue = orders
      .filter(o => o.paymentStatus === 'COMPLETED')
      .reduce((sum, o) => sum + Number(o.totalAmount), 0);

    return { totalOrders, pendingOrders, completedOrders, totalRevenue };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchDashboardData}>Try Again</Button>
        </div>
      </div>
    );
  }

  const stats = getDashboardStats();

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <div className="bg-gradient-primary text-primary-foreground p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm opacity-90">Manage orders, menu, and system</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/")}
              className="text-primary-foreground hover:bg-white/20"
            >
              View Site
            </Button>
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="text-primary-foreground hover:bg-white/20"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{stats.totalOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{stats.pendingOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{stats.completedOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold">{apiUtils.formatCurrency(stats.totalRevenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="menu">Menu Management</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            {/* Orders Header */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div>
                <h2 className="text-xl font-semibold">Order Management</h2>
                <p className="text-muted-foreground">View and manage all customer orders</p>
              </div>
              <Button onClick={fetchOrders} disabled={ordersLoading}>
                {ordersLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search orders by customer name or order number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Orders List */}
            {ordersLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Loading orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Orders Found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery ? 'No orders match your search' : 'No orders have been placed yet'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <Card key={order.id}>
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            Order #{order.orderNumber}
                            <Badge variant={getStatusBadgeVariant(order.status)}>
                              {order.status}
                            </Badge>
                            <Badge variant={getPaymentStatusBadgeVariant(order.paymentStatus)}>
                              {order.paymentStatus}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            {order.customerName} • {order.customerPhone}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-primary">
                            {apiUtils.formatCurrency(order.totalAmount)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {apiUtils.formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {order.orderItems.map((item) => (
                          <div key={item.id} className="flex justify-between items-center p-2 bg-muted rounded">
                            <div className="flex items-center gap-3">
                              {item.menuItem.image && (
                                <img 
                                  src={item.menuItem.image} 
                                  alt={item.menuItem.name}
                                  className="w-8 h-8 rounded object-cover"
                                />
                              )}
                              <span className="font-medium">{item.menuItem.name}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">
                                {item.quantity} × {apiUtils.formatCurrency(item.unitPrice)}
                              </p>
                              <p className="font-medium">
                                {apiUtils.formatCurrency(item.totalPrice)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {order.notes && (
                        <div className="mt-3 p-3 bg-muted rounded">
                          <p className="text-sm">
                            <span className="font-medium">Notes:</span> {order.notes}
                          </p>
                        </div>
                      )}

                      {/* Status Update Buttons */}
                      <div className="flex flex-wrap gap-2 mt-4">
                        {order.status === 'PENDING' && (
                          <Button 
                            size="sm" 
                            onClick={() => updateOrderStatus(order.id, 'CONFIRMED')}
                          >
                            Confirm Order
                          </Button>
                        )}
                        {order.status === 'CONFIRMED' && (
                          <Button 
                            size="sm" 
                            onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                          >
                            Start Preparing
                          </Button>
                        )}
                        {order.status === 'PREPARING' && (
                          <Button 
                            size="sm" 
                            onClick={() => updateOrderStatus(order.id, 'READY')}
                          >
                            Mark Ready
                          </Button>
                        )}
                        {order.status === 'READY' && (
                          <Button 
                            size="sm" 
                            onClick={() => updateOrderStatus(order.id, 'COMPLETED')}
                          >
                            Mark Delivered
                          </Button>
                        )}
                        {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                          >
                            Cancel Order
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="menu" className="space-y-4">
            {/* Menu Header */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div>
                <h2 className="text-xl font-semibold">Menu Management</h2>
                <p className="text-muted-foreground">Manage food items, prices, and availability</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={fetchMenuItems} disabled={menuLoading}>
                  {menuLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Refresh
                </Button>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </div>

            {/* Menu Items */}
            {menuLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Loading menu items...</p>
              </div>
            ) : menuItems.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Utensils className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Menu Items</h3>
                  <p className="text-muted-foreground">Add your first menu item to get started</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {menuItems.map((item) => (
                  <Card key={item.id}>
                    {item.image && (
                      <div className="aspect-square overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {item.description}
                      </CardDescription>
                      <div className="flex items-center justify-between">
                        <Badge variant={item.isAvailable ? "default" : "secondary"}>
                          {item.isAvailable ? "Available" : "Unavailable"}
                        </Badge>
                        <span className="text-lg font-semibold text-primary">
                          {apiUtils.formatCurrency(item.price)}
                        </span>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
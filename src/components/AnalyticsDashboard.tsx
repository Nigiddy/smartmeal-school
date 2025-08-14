import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Clock,
  Calendar,
  Download,
  RefreshCw,
  Loader2,
  BarChart3,
  PieChart,
  Activity,
  Target
} from "lucide-react";
import { apiUtils } from "@/lib/api";

interface AnalyticsData {
  period: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  orderStatusBreakdown: {
    pending: number;
    confirmed: number;
    preparing: number;
    ready: number;
    completed: number;
    cancelled: number;
  };
  topSellingItems: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  hourlyDistribution: Array<{
    hour: number;
    orders: number;
    revenue: number;
  }>;
  categoryPerformance: Array<{
    category: string;
    orders: number;
    revenue: number;
    percentage: number;
  }>;
  customerMetrics: {
    newCustomers: number;
    repeatCustomers: number;
    averageOrderFrequency: number;
  };
}

interface AnalyticsDashboardProps {
  orders: any[];
  menuItems: any[];
  onRefresh?: () => void;
}

const AnalyticsDashboard = ({ orders, menuItems, onRefresh }: AnalyticsDashboardProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const periods = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' }
  ];

  // Calculate analytics data
  const calculateAnalytics = useCallback(() => {
    if (!orders.length) return null;

    const now = new Date();
    let startDate: Date;

    switch (selectedPeriod) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const filteredOrders = orders.filter(order => 
      new Date(order.createdAt) >= startDate
    );

    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, order) => 
      sum + Number(order.totalAmount), 0
    );
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Order status breakdown
    const orderStatusBreakdown = {
      pending: filteredOrders.filter(o => o.status === 'PENDING').length,
      confirmed: filteredOrders.filter(o => o.status === 'CONFIRMED').length,
      preparing: filteredOrders.filter(o => o.status === 'PREPARING').length,
      ready: filteredOrders.filter(o => o.status === 'READY').length,
      completed: filteredOrders.filter(o => o.status === 'COMPLETED').length,
      cancelled: filteredOrders.filter(o => o.status === 'CANCELLED').length
    };

    // Top selling items
    const itemSales = new Map();
    filteredOrders.forEach(order => {
      order.orderItems?.forEach((item: any) => {
        const key = item.menuItem?.name || 'Unknown Item';
        const existing = itemSales.get(key) || { quantity: 0, revenue: 0 };
        itemSales.set(key, {
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + (item.quantity * item.unitPrice)
        });
      });
    });

    const topSellingItems = Array.from(itemSales.entries())
      .map(([name, data]: [string, any]) => ({
        name,
        quantity: data.quantity,
        revenue: data.revenue
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Hourly distribution
    const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => {
      const hourOrders = filteredOrders.filter(order => {
        const orderHour = new Date(order.createdAt).getHours();
        return orderHour === hour;
      });
      
      return {
        hour,
        orders: hourOrders.length,
        revenue: hourOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0)
      };
    });

    // Category performance
    const categorySales = new Map();
    filteredOrders.forEach(order => {
      order.orderItems?.forEach((item: any) => {
        const category = item.menuItem?.category || 'Uncategorized';
        const existing = categorySales.get(category) || { orders: 0, revenue: 0 };
        categorySales.set(category, {
          orders: existing.orders + 1,
          revenue: existing.revenue + (item.quantity * item.unitPrice)
        });
      });
    });

    const categoryPerformance = Array.from(categorySales.entries())
      .map(([category, data]: [string, any]) => ({
        category,
        orders: data.orders,
        revenue: data.revenue,
        percentage: (data.orders / totalOrders) * 100
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Customer metrics (simplified)
    const customerMetrics = {
      newCustomers: Math.floor(totalOrders * 0.3), // Simulated
      repeatCustomers: Math.floor(totalOrders * 0.7), // Simulated
      averageOrderFrequency: totalOrders > 0 ? (totalOrders / Math.max(1, Math.floor(totalOrders * 0.7))).toFixed(1) : '0'
    };

    return {
      period: selectedPeriod,
      totalOrders,
      totalRevenue,
      averageOrderValue,
      orderStatusBreakdown,
      topSellingItems,
      hourlyDistribution,
      categoryPerformance,
      customerMetrics
    };
  }, [orders, selectedPeriod]);

  // Update analytics when data changes
  useEffect(() => {
    const data = calculateAnalytics();
    setAnalyticsData(data);
  }, [calculateAnalytics]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const exportAnalytics = () => {
    if (!analyticsData) return;

    const csvContent = [
      'Metric,Value',
      `Total Orders,${analyticsData.totalOrders}`,
      `Total Revenue,${apiUtils.formatCurrency(analyticsData.totalRevenue)}`,
      `Average Order Value,${apiUtils.formatCurrency(analyticsData.averageOrderValue)}`,
      '',
      'Order Status Breakdown',
      'Status,Count',
      `Pending,${analyticsData.orderStatusBreakdown.pending}`,
      `Confirmed,${analyticsData.orderStatusBreakdown.confirmed}`,
      `Preparing,${analyticsData.orderStatusBreakdown.preparing}`,
      `Ready,${analyticsData.orderStatusBreakdown.ready}`,
      `Completed,${analyticsData.orderStatusBreakdown.completed}`,
      `Cancelled,${analyticsData.orderStatusBreakdown.cancelled}`,
      '',
      'Top Selling Items',
      'Item,Quantity,Revenue',
      ...analyticsData.topSellingItems.map(item => 
        `${item.name},${item.quantity},${apiUtils.formatCurrency(item.revenue)}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartmeal-analytics-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!analyticsData) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive insights into your business performance
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periods.map(period => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button onClick={handleRefresh} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
          
          <Button variant="outline" onClick={exportAnalytics}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {selectedPeriod === 'today' ? 'vs yesterday' : 'vs previous period'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {apiUtils.formatCurrency(analyticsData.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedPeriod === 'today' ? 'vs yesterday' : 'vs previous period'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {apiUtils.formatCurrency(analyticsData.averageOrderValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per order value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.totalOrders > 0 
                ? Math.round((analyticsData.orderStatusBreakdown.completed / analyticsData.totalOrders) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Orders completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order Status Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Order Status Distribution</CardTitle>
                <CardDescription>Current order status breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analyticsData.orderStatusBreakdown).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          status === 'pending' ? 'bg-yellow-500' :
                          status === 'confirmed' ? 'bg-blue-500' :
                          status === 'preparing' ? 'bg-orange-500' :
                          status === 'ready' ? 'bg-green-500' :
                          status === 'completed' ? 'bg-green-600' :
                          'bg-red-500'
                        }`} />
                        <span className="capitalize">{status}</span>
                      </div>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Selling Items */}
            <Card>
              <CardHeader>
                <CardTitle>Top Selling Items</CardTitle>
                <CardDescription>Most popular menu items</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.topSellingItems.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{item.quantity} sold</div>
                        <div className="text-sm text-muted-foreground">
                          {apiUtils.formatCurrency(item.revenue)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hourly Order Distribution</CardTitle>
              <CardDescription>Orders and revenue by hour of day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-6 gap-2">
                {analyticsData.hourlyDistribution.map((hour) => (
                  <div key={hour.hour} className="text-center">
                    <div className="text-sm font-medium">{hour.hour}:00</div>
                    <div className="text-lg font-bold text-primary">{hour.orders}</div>
                    <div className="text-xs text-muted-foreground">
                      {apiUtils.formatCurrency(hour.revenue)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
              <CardDescription>Revenue and orders by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.categoryPerformance.map((category) => (
                  <div key={category.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{category.category}</span>
                      <div className="text-right">
                        <div className="font-medium">{category.orders} orders</div>
                        <div className="text-sm text-muted-foreground">
                          {apiUtils.formatCurrency(category.revenue)}
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(category.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>New Customers</CardTitle>
                <CardDescription>First-time orders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {analyticsData.customerMetrics.newCustomers}
                </div>
                <p className="text-sm text-muted-foreground">
                  New customers this period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Repeat Customers</CardTitle>
                <CardDescription>Returning customers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {analyticsData.customerMetrics.repeatCustomers}
                </div>
                <p className="text-sm text-muted-foreground">
                  Repeat customers this period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Frequency</CardTitle>
                <CardDescription>Average orders per customer</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {analyticsData.customerMetrics.averageOrderFrequency}
                </div>
                <p className="text-sm text-muted-foreground">
                  Orders per customer
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;

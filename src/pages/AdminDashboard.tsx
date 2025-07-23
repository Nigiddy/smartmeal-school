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
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock data for orders
const mockOrders = [
  {
    id: "SM001234",
    customerName: "John Doe",
    studentId: "STU2024001",
    class: "Form 4A",
    items: [
      { name: "Chicken Rice Bowl", quantity: 1, price: 250 },
      { name: "Fresh Juice", quantity: 1, price: 80 }
    ],
    total: 330,
    status: "completed",
    orderTime: "2024-01-15T10:30:00Z",
    paymentMethod: "M-Pesa"
  },
  {
    id: "SM001235",
    customerName: "Jane Smith",
    studentId: "STU2024002",
    class: "Form 3B",
    items: [
      { name: "Beef Stew & Ugali", quantity: 2, price: 300 }
    ],
    total: 600,
    status: "preparing",
    orderTime: "2024-01-15T11:15:00Z",
    paymentMethod: "M-Pesa"
  },
  {
    id: "SM001236",
    customerName: "Mike Johnson",
    studentId: "STU2024003",
    class: "Form 2A",
    items: [
      { name: "Vegetable Samosa", quantity: 3, price: 50 },
      { name: "Fresh Juice", quantity: 2, price: 80 }
    ],
    total: 310,
    status: "ready",
    orderTime: "2024-01-15T12:00:00Z",
    paymentMethod: "M-Pesa"
  }
];

// Mock menu data
const mockMenuItems = [
  {
    id: "1",
    name: "Chicken Rice Bowl",
    description: "Grilled chicken with steamed rice and vegetables",
    price: 250,
    category: "Main Course",
    available: true
  },
  {
    id: "2",
    name: "Beef Stew & Ugali",
    description: "Traditional beef stew served with fresh ugali",
    price: 300,
    category: "Main Course",
    available: true
  },
  {
    id: "3",
    name: "Fish Fillet",
    description: "Grilled tilapia with chips and salad",
    price: 280,
    category: "Main Course",
    available: false
  },
  {
    id: "4",
    name: "Vegetable Samosa",
    description: "Crispy pastry filled with spiced vegetables",
    price: 50,
    category: "Snack",
    available: true
  }
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [orders] = useState(mockOrders);
  const [menuItems, setMenuItems] = useState(mockMenuItems);

  // Check authentication
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("smartmeal_admin_auth");
    if (!isAuthenticated) {
      navigate("/admin/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("smartmeal_admin_auth");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
    navigate("/admin/login");
  };

  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleMenuItemAvailability = (itemId: string) => {
    setMenuItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, available: !item.available } : item
    ));
    toast({
      title: "Menu updated",
      description: "Item availability has been updated",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-success text-success-foreground";
      case "preparing": return "bg-warning text-warning-foreground";
      case "ready": return "bg-primary text-primary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed": return "Completed";
      case "preparing": return "Preparing";
      case "ready": return "Ready";
      default: return status;
    }
  };

  // Calculate stats
  const todayOrders = orders.length;
  const todayRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const preparingOrders = orders.filter(o => o.status === "preparing").length;

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <div className="bg-gradient-primary text-primary-foreground p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">SmartMeal Admin</h1>
            <p className="text-sm opacity-90">Dashboard & Order Management</p>
          </div>
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

      <div className="max-w-6xl mx-auto p-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{todayOrders}</p>
                  <p className="text-sm text-muted-foreground">Today's Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">KSh {todayRevenue}</p>
                  <p className="text-sm text-muted-foreground">Today's Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{preparingOrders}</p>
                  <p className="text-sm text-muted-foreground">Being Prepared</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">↑ 12%</p>
                  <p className="text-sm text-muted-foreground">Growth vs Yesterday</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="orders">Order Management</TabsTrigger>
            <TabsTrigger value="menu">Menu Management</TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Recent Orders</CardTitle>
                    <CardDescription>Track and manage customer orders</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search by Order ID, Name, or Student ID..."
                        className="pl-10 w-80"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredOrders.map((order) => (
                    <div key={order.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold">Order #{order.id}</h3>
                            <Badge className={getStatusColor(order.status)}>
                              {getStatusText(order.status)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {order.customerName} • {order.studentId} • {order.class}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.orderTime).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">KSh {order.total}</p>
                          <p className="text-xs text-muted-foreground">{order.paymentMethod}</p>
                        </div>
                      </div>
                      
                      <div className="text-sm">
                        <p className="font-medium mb-1">Items:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-muted-foreground">
                          {order.items.map((item, index) => (
                            <span key={index}>
                              {item.name} × {item.quantity}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Menu Tab */}
          <TabsContent value="menu" className="space-y-4">
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Menu Management</CardTitle>
                    <CardDescription>Add, edit, and manage menu items</CardDescription>
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {menuItems.map((item) => (
                    <div key={item.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-sm text-muted-foreground mb-1">{item.description}</p>
                          <p className="text-lg font-bold text-primary">KSh {item.price}</p>
                          <Badge variant="outline" className="text-xs">
                            {item.category}
                          </Badge>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button size="sm" variant="outline">
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <Badge className={item.available ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}>
                          {item.available ? "Available" : "Out of Stock"}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => toggleMenuItemAvailability(item.id)}
                        >
                          Toggle
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
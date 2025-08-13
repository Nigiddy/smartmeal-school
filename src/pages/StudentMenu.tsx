import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  ShoppingCart, 
  ArrowLeft, 
  Plus, 
  Minus,
  Loader2,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MenuService, MenuItem, apiUtils } from "@/lib/api";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

const StudentMenu = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch menu items on component mount
  useEffect(() => {
    fetchMenuItems();
  }, []);

  // Filter items when search query or category changes
  useEffect(() => {
    let filtered = menuItems;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  }, [menuItems, selectedCategory, searchQuery]);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [menuData, categoriesData] = await Promise.all([
        MenuService.getMenuItems(),
        MenuService.getMenuCategories()
      ]);
      
      setMenuItems(menuData);
      setCategories(categoriesData);
      setFilteredItems(menuData);
    } catch (error) {
      console.error('Error fetching menu:', error);
      setError('Failed to load menu. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to load menu. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: MenuItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prevCart, {
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          image: item.image
        }];
      }
    });

    toast({
      title: 'Added to cart',
      description: `${item.name} added to your cart`,
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === itemId);
      
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map(item =>
          item.id === itemId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      } else {
        return prevCart.filter(item => item.id !== itemId);
      }
    });
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const proceedToOrder = () => {
    if (cart.length === 0) {
      toast({
        title: 'Empty cart',
        description: 'Please add items to your cart first',
        variant: 'destructive'
      });
      return;
    }

    navigate("/order", { 
      state: { 
        items: cart,
        total: getCartTotal()
      } 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading menu...</p>
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
          <Button onClick={fetchMenuItems}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <div className="bg-gradient-primary text-primary-foreground p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/")}
            className="text-primary-foreground hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="text-center">
            <h1 className="text-xl font-semibold">Menu</h1>
            <p className="text-sm opacity-90">Order your favorite meals</p>
          </div>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/order")}
            className="text-primary-foreground hover:bg-white/20 relative"
            disabled={cart.length === 0}
          >
            <ShoppingCart className="h-4 w-4" />
            {getCartItemCount() > 0 && (
              <Badge 
                variant="secondary" 
                className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs"
              >
                {getCartItemCount()}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search for meals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all">All</TabsTrigger>
              {categories.map(category => (
                <TabsTrigger key={category} value={category}>
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Menu Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-24">
          {filteredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden">
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
                <Button
                  onClick={() => addToCart(item)}
                  disabled={!item.isAvailable}
                  className="w-full"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-20">
          <Button 
            onClick={proceedToOrder}
            size="lg"
            className="shadow-lg"
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Proceed to Order ({getCartItemCount()} items)
            <span className="ml-2 font-semibold">
              {apiUtils.formatCurrency(getCartTotal())}
            </span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default StudentMenu;
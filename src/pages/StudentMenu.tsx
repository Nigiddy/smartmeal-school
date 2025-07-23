import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Plus, Minus, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import chickenRiceBowlImg from "@/assets/chicken-rice-bowl.jpg";
import beefStewUgaliImg from "@/assets/beef-stew-ugali.jpg";
import vegetableSamosaImg from "@/assets/vegetable-samosa.jpg";
import freshJuiceImg from "@/assets/fresh-juice.jpg";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
}

const mockMenu: MenuItem[] = [
  {
    id: "1",
    name: "Chicken Rice Bowl",
    description: "Grilled chicken with steamed rice and vegetables",
    price: 250,
    category: "Main Course",
    image: chickenRiceBowlImg,
    available: true
  },
  {
    id: "2", 
    name: "Beef Stew & Ugali",
    description: "Traditional beef stew served with fresh ugali",
    price: 300,
    category: "Main Course", 
    image: beefStewUgaliImg,
    available: true
  },
  {
    id: "3",
    name: "Fish Fillet",
    description: "Grilled tilapia with chips and salad",
    price: 280,
    category: "Main Course",
    image: chickenRiceBowlImg, 
    available: false
  },
  {
    id: "4",
    name: "Vegetable Samosa",
    description: "Crispy pastry filled with spiced vegetables",
    price: 50,
    category: "Snack",
    image: vegetableSamosaImg,
    available: true
  },
  {
    id: "5",
    name: "Fresh Juice",
    description: "Orange, mango, or passion fruit juice",
    price: 80,
    category: "Beverage",
    image: freshJuiceImg,
    available: true
  }
];

const StudentMenu = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cart, setCart] = useState<{[key: string]: number}>({});
  
  const categories = Array.from(new Set(mockMenu.map(item => item.category)));
  
  const addToCart = (itemId: string) => {
    setCart(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
    toast({
      title: "Added to cart",
      description: "Item has been added to your order",
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[itemId] > 1) {
        newCart[itemId]--;
      } else {
        delete newCart[itemId];
      }
      return newCart;
    });
  };

  const getTotalItems = () => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalPrice = () => {
    return Object.entries(cart).reduce((total, [itemId, qty]) => {
      const item = mockMenu.find(m => m.id === itemId);
      return total + (item ? item.price * qty : 0);
    }, 0);
  };

  const proceedToOrder = () => {
    if (getTotalItems() === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before proceeding",
        variant: "destructive"
      });
      return;
    }
    navigate("/order", { state: { cart, menu: mockMenu } });
  };

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <div className="bg-gradient-primary text-primary-foreground p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/")}
              className="text-primary-foreground hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">SmartMeal Menu</h1>
              <p className="text-sm opacity-90">Fresh meals for students</p>
            </div>
          </div>
          <Button 
            onClick={proceedToOrder}
            className="bg-white text-primary hover:bg-gray-100 relative"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Cart ({getTotalItems()})
            {getTotalItems() > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-accent text-accent-foreground">
                {getTotalItems()}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Menu Content */}
      <div className="max-w-4xl mx-auto p-4">
        {categories.map((category) => (
          <div key={category} className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-foreground">{category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockMenu
                .filter(item => item.category === category)
                .map((item) => (
                  <Card key={item.id} className="shadow-card hover:shadow-medium transition-all duration-300">
                    <CardHeader className="p-0">
                      <div className="h-48 bg-muted rounded-t-lg bg-cover bg-center" 
                           style={{ backgroundImage: `url(${item.image})` }} />
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <div className="text-right">
                          <p className="text-xl font-bold text-primary">KSh {item.price}</p>
                          {!item.available && (
                            <Badge variant="destructive" className="text-xs">
                              Out of Stock
                            </Badge>
                          )}
                        </div>
                      </div>
                      <CardDescription className="text-sm mb-4">
                        {item.description}
                      </CardDescription>
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                      {item.available ? (
                        <div className="flex items-center justify-between w-full">
                          {cart[item.id] ? (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeFromCart(item.id)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="font-medium px-2">{cart[item.id]}</span>
                              <Button
                                size="sm"
                                onClick={() => addToCart(item.id)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button onClick={() => addToCart(item.id)} className="flex-1">
                              <Plus className="h-4 w-4 mr-2" />
                              Add to Cart
                            </Button>
                          )}
                        </div>
                      ) : (
                        <Button disabled className="w-full">
                          Out of Stock
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Cart Summary */}
      {getTotalItems() > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto">
          <Card className="bg-primary text-primary-foreground shadow-medium">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{getTotalItems()} items</p>
                  <p className="text-sm opacity-90">Total: KSh {getTotalPrice()}</p>
                </div>
                <Button 
                  onClick={proceedToOrder}
                  className="bg-white text-primary hover:bg-gray-100"
                >
                  Order Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default StudentMenu;
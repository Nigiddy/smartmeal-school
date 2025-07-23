import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Edit3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const OrderForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const { cart, menu } = location.state || { cart: {}, menu: [] };
  
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    studentId: "", 
    class: "",
    phone: "",
    notes: ""
  });

  const getOrderItems = () => {
    return Object.entries(cart).map(([itemId, quantity]) => {
      const item = menu.find((m: any) => m.id === itemId);
      return { item, quantity: quantity as number };
    }).filter(order => order.item);
  };

  const getTotalPrice = () => {
    return getOrderItems().reduce((total, order) => {
      return total + (order.item.price * order.quantity);
    }, 0);
  };

  const handleInputChange = (field: string, value: string) => {
    setCustomerInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const proceedToPayment = () => {
    // Validate required fields
    if (!customerInfo.name || !customerInfo.studentId || !customerInfo.class) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const orderData = {
      customer: customerInfo,
      items: getOrderItems(),
      total: getTotalPrice(),
      orderTime: new Date().toISOString()
    };

    navigate("/payment", { state: orderData });
  };

  const orderItems = getOrderItems();

  if (orderItems.length === 0) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">No Items in Cart</h2>
            <p className="text-muted-foreground mb-4">Please add items to your cart first</p>
            <Button onClick={() => navigate("/menu")}>
              Go to Menu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <div className="bg-gradient-primary text-primary-foreground p-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/menu")}
            className="text-primary-foreground hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Order Details</h1>
            <p className="text-sm opacity-90">Complete your order information</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Order Summary */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Order Summary</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate("/menu")}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Order
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orderItems.map(({ item, quantity }) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">Qty: {quantity}</p>
                  </div>
                  <p className="font-semibold">KSh {item.price * quantity}</p>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">KSh {getTotalPrice()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
            <CardDescription>Please provide your details for the order</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={customerInfo.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="studentId">Student ID *</Label>
                <Input
                  id="studentId"
                  placeholder="e.g., STU2024001"
                  value={customerInfo.studentId}
                  onChange={(e) => handleInputChange("studentId", e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="class">Class/Grade *</Label>
                <Input
                  id="class"
                  placeholder="e.g., Form 4A"
                  value={customerInfo.class}
                  onChange={(e) => handleInputChange("class", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="e.g., 0712345678"
                  value={customerInfo.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Special Instructions (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any special requests or dietary requirements..."
                value={customerInfo.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => navigate("/menu")}
            className="flex-1"
          >
            Back to Menu
          </Button>
          <Button 
            onClick={proceedToPayment}
            className="flex-1 bg-gradient-primary"
          >
            Proceed to Payment
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderForm;
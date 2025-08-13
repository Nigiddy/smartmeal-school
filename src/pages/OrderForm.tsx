import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  ShoppingCart, 
  User, 
  Phone, 
  CreditCard,
  Loader2,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { OrdersService, apiUtils } from "@/lib/api";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface OrderFormData {
  customerName: string;
  customerPhone: string;
  phoneNumber: string;
  notes: string;
}

const OrderForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<OrderFormData>({
    customerName: "",
    customerPhone: "",
    phoneNumber: "",
    notes: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<OrderFormData>>({});

  const cartData = location.state;

  useEffect(() => {
    if (!cartData || !cartData.items || cartData.items.length === 0) {
      toast({
        title: "No items in cart",
        description: "Please add items to your cart first",
        variant: "destructive"
      });
      navigate("/menu");
      return;
    }
  }, [cartData, navigate, toast]);

  const validateForm = (): boolean => {
    const newErrors: Partial<OrderFormData> = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = "Customer name is required";
    }

    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = "Customer phone is required";
    } else if (!apiUtils.validatePhoneNumber(formData.customerPhone)) {
      newErrors.customerPhone = "Please enter a valid phone number";
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "M-Pesa phone number is required";
    } else if (!apiUtils.validatePhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber = "Please enter a valid M-Pesa phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof OrderFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const orderData = {
        items: cartData.items.map((item: CartItem) => ({
          menuItemId: item.id,
          quantity: item.quantity
        })),
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        phoneNumber: apiUtils.formatPhoneNumber(formData.phoneNumber),
        notes: formData.notes.trim() || undefined
      };

      const order = await OrdersService.createOrder(orderData);

      toast({
        title: "Order created successfully!",
        description: `Order #${order.orderNumber} has been created`,
      });

      // Navigate to payment with order data
      navigate("/payment", { 
        state: { 
          orderId: order.id,
          orderNumber: order.orderNumber,
          customer: {
            name: order.customerName,
            phone: order.customerPhone
          },
          items: cartData.items,
          total: order.totalAmount,
          notes: order.notes
        } 
      });

    } catch (error) {
      console.error('Error creating order:', error);
      
      let errorMessage = 'Failed to create order. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Order creation failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!cartData || !cartData.items || cartData.items.length === 0) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
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

  const getTotalItems = () => {
    return cartData.items.reduce((total: number, item: CartItem) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartData.items.reduce((total: number, item: CartItem) => total + (item.price * item.quantity), 0);
  };

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
            <h1 className="text-xl font-semibold">Complete Your Order</h1>
            <p className="text-sm opacity-90">Review items and provide details</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        {/* Order Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Order Summary
            </CardTitle>
            <CardDescription>
              {getTotalItems()} items • Total: {apiUtils.formatCurrency(getTotalPrice())}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cartData.items.map((item: CartItem) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    {item.image && (
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-12 h-12 rounded-md object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {apiUtils.formatCurrency(item.price)} × {item.quantity}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {apiUtils.formatCurrency(item.price * item.quantity)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </CardTitle>
            <CardDescription>
              Please provide your details to complete the order
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Full Name *</Label>
                  <Input
                    id="customerName"
                    placeholder="Enter your full name"
                    value={formData.customerName}
                    onChange={(e) => handleInputChange('customerName', e.target.value)}
                    className={errors.customerName ? 'border-destructive' : ''}
                  />
                  {errors.customerName && (
                    <p className="text-sm text-destructive">{errors.customerName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Contact Phone *</Label>
                  <Input
                    id="customerPhone"
                    placeholder="e.g., 0712345678"
                    value={formData.customerPhone}
                    onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                    className={errors.customerPhone ? 'border-destructive' : ''}
                  />
                  {errors.customerPhone && (
                    <p className="text-sm text-destructive">{errors.customerPhone}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  M-Pesa Phone Number *
                </Label>
                <Input
                  id="phoneNumber"
                  placeholder="e.g., 0712345678 (for payment)"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  className={errors.phoneNumber ? 'border-destructive' : ''}
                />
                {errors.phoneNumber && (
                  <p className="text-sm text-destructive">{errors.phoneNumber}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  This number will receive the M-Pesa payment prompt
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Special Instructions (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any special requests or dietary requirements..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Creating Order...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      Proceed to Payment ({apiUtils.formatCurrency(getTotalPrice())})
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderForm;
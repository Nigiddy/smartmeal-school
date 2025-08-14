import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Home, 
  Clock, 
  Smartphone, 
  Receipt,
  Download,
  Share2,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiUtils } from "@/lib/api";

interface ConfirmationData {
  orderId: string;
  orderNumber: string;
  customer: {
    name: string;
    phone: string;
  };
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  transactionId?: string;
  checkoutRequestId?: string;
  notes?: string;
}

const Confirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [orderData, setOrderData] = useState<ConfirmationData | null>(null);
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);

  useEffect(() => {
    if (!location.state) {
      navigate("/");
      return;
    }
    setOrderData(location.state);
  }, [location.state, navigate]);

  const generateReceipt = async () => {
    if (!orderData) return;
    
    setIsGeneratingReceipt(true);
    
    try {
      // Create receipt content
      const receiptContent = `
        SMARTMEAL - ORDER RECEIPT
        
        Order Number: ${orderData.orderNumber}
        Date: ${new Date().toLocaleDateString('en-KE')}
        Time: ${new Date().toLocaleTimeString('en-KE')}
        
        Customer: ${orderData.customer.name}
        Phone: ${orderData.customer.phone}
        
        Items:
        ${orderData.items.map(item => 
          `${item.name} x${item.quantity} - ${apiUtils.formatCurrency(item.price * item.quantity)}`
        ).join('\n')}
        
        Total: ${apiUtils.formatCurrency(orderData.total)}
        Payment Method: ${orderData.paymentMethod}
        Payment Status: ${orderData.paymentStatus}
        ${orderData.transactionId ? `Transaction ID: ${orderData.transactionId}` : ''}
        
        Thank you for choosing SmartMeal!
        Your order is being prepared.
      `;

      // Create and download receipt
      const blob = new Blob([receiptContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${orderData.orderNumber}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Receipt downloaded",
        description: "Your order receipt has been saved",
      });
    } catch (error) {
      console.error('Error generating receipt:', error);
      toast({
        title: "Error",
        description: "Failed to generate receipt",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingReceipt(false);
    }
  };

  const shareOrder = async () => {
    if (!orderData) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `SmartMeal Order #${orderData.orderNumber}`,
          text: `I just ordered from SmartMeal! Order #${orderData.orderNumber} - ${apiUtils.formatCurrency(orderData.total)}`,
          url: window.location.href
        });
      } else {
        // Fallback for browsers that don't support Web Share API
        await navigator.clipboard.writeText(
          `SmartMeal Order #${orderData.orderNumber} - ${apiUtils.formatCurrency(orderData.total)}`
        );
        toast({
          title: "Order details copied",
          description: "Order information copied to clipboard",
        });
      }
    } catch (error) {
      console.error('Error sharing order:', error);
    }
  };

  if (!orderData) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <div className="bg-gradient-primary text-primary-foreground p-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Order Confirmed!</h1>
          <p className="text-sm opacity-90">
            Your order has been successfully placed and confirmed
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        {/* Order Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Order Summary
            </CardTitle>
            <CardDescription>
              Order #{orderData.orderNumber} • {new Date().toLocaleDateString('en-KE')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{orderData.customer.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Order placed at {new Date().toLocaleTimeString('en-KE')}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-3">
                {orderData.items.map((item) => (
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

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total Amount</span>
                  <span className="text-primary">{apiUtils.formatCurrency(orderData.total)}</span>
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">Payment Successful</span>
                </div>
                <div className="text-sm text-green-700 space-y-1">
                  <p>Method: {orderData.paymentMethod}</p>
                  {orderData.transactionId && (
                    <p>Transaction ID: {orderData.transactionId}</p>
                  )}
                  <p>Status: {orderData.paymentStatus}</p>
                </div>
              </div>

              {/* Special Instructions */}
              {orderData.notes && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Smartphone className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Special Instructions</span>
                  </div>
                  <p className="text-sm text-blue-700">{orderData.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Order Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
            <CardDescription>Track your order progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium">Order Confirmed</p>
                  <p className="text-sm text-muted-foreground">Your order has been received</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium">In Preparation</p>
                  <p className="text-sm text-muted-foreground">Chefs are preparing your meal</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <Clock className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-500">Ready for Pickup</p>
                  <p className="text-sm text-gray-400">Your order will be ready soon</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-500">Completed</p>
                  <p className="text-sm text-gray-400">Order fulfilled</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Button 
            onClick={generateReceipt}
            disabled={isGeneratingReceipt}
            variant="outline"
            className="h-12"
          >
            {isGeneratingReceipt ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download Receipt
              </>
            )}
          </Button>

          <Button 
            onClick={shareOrder}
            variant="outline"
            className="h-12"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share Order
          </Button>

          <Button 
            onClick={() => navigate("/")}
            className="h-12"
          >
            <Home className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>

        {/* Help Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>• Your order is being prepared and will be ready soon</p>
              <p>• You'll receive updates on your order status</p>
              <p>• Contact support if you have any questions</p>
              <p>• Order number: <span className="font-mono font-medium">{orderData.orderNumber}</span></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Confirmation;
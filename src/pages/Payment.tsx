import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Smartphone, 
  CheckCircle, 
  Loader2, 
  AlertCircle, 
  RefreshCw,
  CreditCard,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMpesaPayment } from "@/hooks/use-mpesa-payment";
import { apiUtils } from "@/lib/api";

interface PaymentOrderData {
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
  notes?: string;
}

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { 
    paymentState, 
    initiatePayment, 
    resetPayment, 
    cancelPayment, 
    retryPayment,
    validatePhoneNumber 
  } = useMpesaPayment();
  
  const orderData: PaymentOrderData = location.state;
  
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!orderData) {
      navigate("/menu");
      return;
    }

    // Pre-fill phone number if available
    if (orderData.customer.phone) {
      setPhoneNumber(orderData.customer.phone);
    }
  }, [orderData, navigate]);

  // Handle successful payment
  useEffect(() => {
    if (paymentState.status === 'success') {
      setTimeout(() => {
        navigate("/confirmation", { 
          state: { 
            orderId: orderData.orderId,
            orderNumber: orderData.orderNumber,
            customer: orderData.customer,
            items: orderData.items,
            total: orderData.total,
            paymentMethod: "M-Pesa",
            paymentStatus: "completed",
            transactionId: paymentState.transactionId,
            checkoutRequestId: paymentState.checkoutRequestId
          } 
        });
      }, 2000);
    }
  }, [paymentState.status, navigate, orderData, paymentState.transactionId, paymentState.checkoutRequestId]);

  const handlePayment = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid Kenyan phone number (e.g., 0712345678)",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const description = `SmartMeal Order #${orderData.orderNumber} - ${orderData.customer.name}`;
      
      await initiatePayment({
        phoneNumber,
        amount: orderData.total,
        orderId: orderData.orderId,
        description
      });
    } catch (error) {
      console.error('Payment error:', error);
      setIsSubmitting(false);
    }
  };

  const handleRetry = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid Kenyan phone number",
        variant: "destructive"
      });
      return;
    }

    const description = `SmartMeal Order #${orderData.orderNumber} - ${orderData.customer.name}`;
    await retryPayment({
      phoneNumber,
      amount: orderData.total,
      orderId: orderData.orderId,
      description
    });
  };

  if (!orderData) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold mb-4">No Order Found</h2>
            <p className="text-muted-foreground mb-4">Please start by adding items to your cart</p>
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
            onClick={() => navigate("/order")}
            className="text-primary-foreground hover:bg-white/20"
            disabled={paymentState.status === "processing"}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Payment</h1>
            <p className="text-sm opacity-90">Complete your order with M-Pesa</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        {/* Order Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Order Summary
            </CardTitle>
            <CardDescription>
              Order #{orderData.orderNumber} • {orderData.customer.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-4">
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
            
            <div className="border-t pt-3">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total Amount</span>
                <span className="text-primary">{apiUtils.formatCurrency(orderData.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              M-Pesa Payment
            </CardTitle>
            <CardDescription>
              Enter your M-Pesa phone number to receive payment prompt
            </CardDescription>
          </CardHeader>
          <CardContent>
            {paymentState.status === 'idle' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">M-Pesa Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    placeholder="e.g., 0712345678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="text-lg"
                  />
                  <p className="text-xs text-muted-foreground">
                    You will receive an M-Pesa prompt on this number
                  </p>
                </div>

                <Button 
                  onClick={handlePayment}
                  className="w-full h-12 text-lg"
                  disabled={!phoneNumber.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Initiating Payment...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      Pay {apiUtils.formatCurrency(orderData.total)} with M-Pesa
                    </>
                  )}
                </Button>
              </div>
            )}

            {paymentState.status === 'initiating' && (
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">Initiating payment...</p>
              </div>
            )}

            {paymentState.status === 'processing' && (
              <div className="space-y-4">
                <div className="text-center space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                      <Smartphone className="h-8 w-8 text-primary animate-pulse" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Payment Initiated!</h3>
                    <p className="text-muted-foreground mb-4">
                      Please check your phone for the M-Pesa prompt
                    </p>
                  </div>

                  <Progress value={paymentState.progress} className="w-full" />
                  <p className="text-sm text-muted-foreground">
                    Waiting for payment confirmation...
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={cancelPayment}
                    className="flex-1"
                  >
                    Cancel Payment
                  </Button>
                  <Button 
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="flex-1"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            )}

            {paymentState.status === 'success' && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                
                <div>
                  <h3 className="font-semibold text-green-600 mb-2">Payment Successful!</h3>
                  <p className="text-muted-foreground">
                    Redirecting to confirmation page...
                  </p>
                </div>

                <Progress value={100} className="w-full" />
              </div>
            )}

            {paymentState.status === 'failed' && (
              <div className="space-y-4">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-red-600 mb-2">Payment Failed</h3>
                    <p className="text-muted-foreground mb-2">
                      {paymentState.error || 'Something went wrong with the payment'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={handleRetry}
                    className="flex-1"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={resetPayment}
                    className="flex-1"
                  >
                    Change Number
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>• Make sure you have sufficient M-Pesa balance</p>
              <p>• Enter the correct phone number registered with M-Pesa</p>
              <p>• Check your phone for the payment prompt</p>
              <p>• Contact support if you encounter any issues</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Payment;
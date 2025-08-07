import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Smartphone, CheckCircle, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMpesaPayment } from "@/hooks/use-mpesa-payment";
import { apiUtils } from "@/lib/api";

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { paymentState, initiatePayment, resetPayment, cancelPayment, validatePhoneNumber } = useMpesaPayment();
  
  const orderData = location.state;
  
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!orderData) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
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
      const orderId = apiUtils.generateOrderId();
      const description = `SmartMeal Order - ${orderData.customer.name}`;
      
      await initiatePayment({
        phoneNumber,
        amount: orderData.total,
        orderId,
        description
      });
    } catch (error) {
      console.error('Payment error:', error);
      setIsSubmitting(false);
    }
  };

  // Handle successful payment
  useEffect(() => {
    if (paymentState.status === 'success') {
      const orderId = apiUtils.generateOrderId();
      setTimeout(() => {
        navigate("/confirmation", { 
          state: { 
            ...orderData, 
            orderId,
            paymentMethod: "M-Pesa",
            paymentStatus: "completed",
            transactionId: paymentState.transactionId
          } 
        });
      }, 2000);
    }
  }, [paymentState.status, navigate, orderData, paymentState.transactionId]);

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
            disabled={paymentState === "processing"}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Payment</h1>
            <p className="text-sm opacity-90">Complete your payment with M-Pesa</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        {paymentState.status === "idle" && (
          <div className="space-y-6">
            {/* Order Summary */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Payment Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Student:</span>
                    <span className="font-medium">{orderData.customer.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Student ID:</span>
                    <span className="font-medium">{orderData.customer.studentId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Items:</span>
                    <span className="font-medium">{orderData.items.length} item(s)</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-lg font-bold">
                    <span>Total Amount:</span>
                    <span className="text-primary">KSh {orderData.total}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* M-Pesa Payment */}
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                    <Smartphone className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <div>
                    <CardTitle>M-Pesa Payment</CardTitle>
                    <CardDescription>Pay securely with your mobile money</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="phone">M-Pesa Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="e.g., 0712345678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="mt-1"
                    maxLength={10}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    You will receive an M-Pesa prompt on this number
                  </p>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Payment Instructions:</h4>
                  <ol className="text-sm text-muted-foreground space-y-1">
                    <li>1. Enter your M-Pesa phone number above</li>
                    <li>2. Click "Pay with M-Pesa" button</li>
                    <li>3. Enter your M-Pesa PIN when prompted</li>
                    <li>4. Confirm the payment on your phone</li>
                  </ol>
                </div>

                <Button 
                  onClick={handlePayment}
                  disabled={isSubmitting}
                  className="w-full bg-gradient-success"
                  size="lg"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Smartphone className="h-4 w-4 mr-2" />
                  )}
                  {isSubmitting ? 'Initiating Payment...' : `Pay KSh ${orderData.total} with M-Pesa`}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {paymentState.status === "initiating" && (
          <Card className="shadow-card">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Initiating Payment</h2>
              <p className="text-muted-foreground mb-6">
                Setting up your M-Pesa payment...
              </p>
              <div className="space-y-2">
                <Progress value={paymentState.progress} className="w-full" />
                <p className="text-sm text-muted-foreground">
                  Preparing payment request...
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {paymentState.status === "processing" && (
          <Card className="shadow-card">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Processing Payment</h2>
              <p className="text-muted-foreground mb-6">
                Please complete the payment on your phone
              </p>
              <div className="space-y-2">
                <Progress value={paymentState.progress} className="w-full" />
                <p className="text-sm text-muted-foreground">
                  {paymentState.progress < 50 ? "Sending payment request..." : 
                   paymentState.progress < 80 ? "Waiting for confirmation..." : 
                   "Finalizing payment..."}
                </p>
              </div>
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  onClick={cancelPayment}
                  className="text-sm"
                >
                  Cancel Payment
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {paymentState.status === "success" && (
          <Card className="shadow-card">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Payment Successful!</h2>
              <p className="text-muted-foreground mb-4">
                Transaction ID: {paymentState.transactionId}
              </p>
              <p className="text-sm text-muted-foreground">
                Redirecting to confirmation page...
              </p>
            </CardContent>
          </Card>
        )}

        {paymentState.status === "failed" && (
          <Card className="shadow-card">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Payment Failed</h2>
              <p className="text-muted-foreground mb-6">
                {paymentState.error || 'An error occurred during payment'}
              </p>
              <div className="flex gap-3 justify-center">
                <Button 
                  variant="outline" 
                  onClick={resetPayment}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button 
                  onClick={() => navigate("/menu")}
                >
                  Back to Menu
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Payment;
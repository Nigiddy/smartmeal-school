import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Download, Home, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Confirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const orderData = location.state;

  if (!orderData) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">No Order Found</h2>
            <p className="text-muted-foreground mb-4">Please start by placing an order</p>
            <Button onClick={() => navigate("/menu")}>
              Go to Menu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const downloadReceipt = () => {
    toast({
      title: "Receipt downloaded",
      description: "Your digital receipt has been saved",
    });
  };

  const orderAgain = () => {
    navigate("/menu");
  };

  return (
    <div className="min-h-screen bg-muted">
      {/* Success Header */}
      <div className="bg-gradient-success text-success-foreground p-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Order Confirmed!</h1>
          <p className="text-sm opacity-90">Your payment was successful and order is being prepared</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Order Details */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Order #{orderData.orderId}</CardTitle>
                <CardDescription>
                  Placed on {new Date(orderData.orderTime).toLocaleDateString()} at{" "}
                  {new Date(orderData.orderTime).toLocaleTimeString()}
                </CardDescription>
              </div>
              <Badge className="bg-success text-success-foreground">
                {orderData.paymentStatus === "completed" ? "Paid" : "Pending"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Student Name</p>
                <p className="font-medium">{orderData.customer.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Student ID</p>
                <p className="font-medium">{orderData.customer.studentId}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Class</p>
                <p className="font-medium">{orderData.customer.class}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Payment Method</p>
                <p className="font-medium">{orderData.paymentMethod}</p>
              </div>
            </div>

            {orderData.customer.notes && (
              <div>
                <p className="text-muted-foreground text-sm">Special Instructions</p>
                <p className="text-sm bg-muted p-2 rounded">{orderData.customer.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orderData.items.map((orderItem: any) => (
                <div key={orderItem.item.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <div>
                    <p className="font-medium">{orderItem.item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      KSh {orderItem.item.price} × {orderItem.quantity}
                    </p>
                  </div>
                  <p className="font-semibold">KSh {orderItem.item.price * orderItem.quantity}</p>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 text-lg font-bold">
                <span>Total Paid</span>
                <span className="text-success">KSh {orderData.total}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>What's Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium">Order Confirmation</p>
                  <p className="text-sm text-muted-foreground">Your order has been received and confirmed</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center text-accent-foreground text-xs font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium">Preparation</p>
                  <p className="text-sm text-muted-foreground">Kitchen staff will prepare your meal (15-20 minutes)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-muted-foreground text-xs font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium">Ready for Pickup</p>
                  <p className="text-sm text-muted-foreground">You'll be notified when your order is ready</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button 
            variant="outline" 
            onClick={downloadReceipt}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Receipt
          </Button>
          <Button 
            variant="outline" 
            onClick={orderAgain}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Order Again
          </Button>
          <Button 
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Button>
        </div>

        {/* Contact Info */}
        <Card className="shadow-card bg-primary/5">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Questions about your order? Contact the cafeteria at{" "}
              <span className="font-medium text-primary">0712-345-678</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Confirmation;
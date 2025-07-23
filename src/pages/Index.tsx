import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Utensils, 
  Smartphone, 
  Clock, 
  Shield,
  ChefHat,
  CreditCard,
  Users,
  TrendingUp
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-muted">
      {/* Hero Section */}
      <div className="bg-gradient-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Utensils className="h-10 w-10" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">SmartMeal</h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Modern Food Ordering for School Communities
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => navigate("/menu")}
              className="bg-white text-primary hover:bg-gray-100 text-lg px-8"
            >
              <ChefHat className="h-5 w-5 mr-2" />
              View Menu & Order
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => navigate("/admin/login")}
              className="border-white text-primary-foreground hover:bg-white/10 text-lg px-8"
            >
              <Shield className="h-5 w-5 mr-2" />
              Admin Login
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why Choose SmartMeal?</h2>
          <p className="text-lg text-muted-foreground">
            Revolutionizing school dining with technology and convenience
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Student Benefits */}
          <Card className="shadow-card">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                <Smartphone className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Easy Mobile Ordering</CardTitle>
              <CardDescription>
                Order your favorite meals directly from your phone. No more long queues!
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mb-3">
                <CreditCard className="h-6 w-6 text-success" />
              </div>
              <CardTitle>M-Pesa Integration</CardTitle>
              <CardDescription>
                Secure cashless payments with M-Pesa. Quick, safe, and convenient.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mb-3">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <CardTitle>Fast Service</CardTitle>
              <CardDescription>
                Pre-order your meals and skip the wait. Get notified when ready for pickup.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-3">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <CardTitle>Student-Friendly</CardTitle>
              <CardDescription>
                Designed specifically for school environments with student needs in mind.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Admin Dashboard</CardTitle>
              <CardDescription>
                Comprehensive order management and real-time tracking for administrators.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mb-3">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <CardTitle>Efficiency Boost</CardTitle>
              <CardDescription>
                Reduce manual work, minimize cash handling, and streamline operations.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* How it Works Section */}
      <div className="bg-card">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground">
              Simple steps to get your meal ordered and ready
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-primary-foreground text-xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Browse Menu</h3>
              <p className="text-muted-foreground">
                View available meals and select your favorites with just a few taps
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4 text-accent-foreground text-xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Pay with M-Pesa</h3>
              <p className="text-muted-foreground">
                Secure payment process using M-Pesa STK push technology
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-4 text-success-foreground text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Collect Your Order</h3>
              <p className="text-muted-foreground">
                Get notified when your meal is ready and collect it from the cafeteria
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join the future of school dining today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => navigate("/menu")}
              className="bg-white text-primary hover:bg-gray-100 text-lg px-8"
            >
              Order Now
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => navigate("/admin/login")}
              className="border-white text-primary-foreground hover:bg-white/10 text-lg px-8"
            >
              Admin Access
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-card border-t">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">
            © 2024 SmartMeal. Making school dining smart and efficient.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;

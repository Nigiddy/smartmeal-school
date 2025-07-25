import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Utensils, 
  Menu, 
  Shield,
  ChefHat,
  Smartphone,
  CreditCard,
  Clock,
  Star
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      
      {/* Main Content */}
      <div className="relative z-10 pb-24">
        {/* Hero Section */}
        <div className="min-h-screen flex flex-col justify-center px-6 pt-8">
          {/* Welcome Badge */}
          <div className="text-center mb-6 animate-fade-in-up">
            <div className="inline-block px-4 py-2 bg-primary/10 backdrop-blur-sm border border-primary/20 rounded-full mb-6">
              <span className="text-sm text-primary font-medium">WELCOME TO SMARTMEAL</span>
            </div>
          </div>

          {/* Main Heading */}
          <div className="text-center mb-8 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Hey, We're{" "}
              <span className="text-primary bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                SmartMeal
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Modern Food Ordering for School Communities
            </p>
          </div>

          {/* Food Illustration */}
          <div className="flex justify-center mb-12 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
            <div className="relative">
              {/* Main food icon */}
              <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-primary/20">
                <ChefHat className="w-16 h-16 md:w-20 md:h-20 text-primary" />
              </div>
              
              {/* Floating icons */}
              <div className="absolute -top-4 -right-4 w-12 h-12 bg-success/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-success/20 animate-pulse">
                <Smartphone className="w-6 h-6 text-success" />
              </div>
              <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-accent/20 animate-pulse" style={{animationDelay: '1s'}}>
                <CreditCard className="w-6 h-6 text-accent" />
              </div>
              <div className="absolute top-1/2 -left-8 w-10 h-10 bg-warning/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-warning/20 animate-pulse" style={{animationDelay: '2s'}}>
                <Clock className="w-5 h-5 text-warning" />
              </div>
            </div>
          </div>

          {/* Primary Actions */}
          <div className="flex flex-col gap-4 max-w-sm mx-auto animate-fade-in-up" style={{animationDelay: '0.6s'}}>
            <Button 
              size="lg"
              onClick={() => navigate("/menu")}
              className="w-full h-14 text-lg bg-primary hover:bg-primary/90 text-primary-foreground animate-scale-in"
            >
              <Menu className="h-5 w-5 mr-3" />
              View Menu & Order
            </Button>
            
            <Button 
              size="lg"
              variant="outline"
              onClick={() => navigate("/admin/login")}
              className="w-full h-14 text-lg border-primary/20 text-foreground hover:bg-primary/10 animate-scale-in"
            >
              <Shield className="h-5 w-5 mr-3" />
              Admin Access
            </Button>
          </div>
        </div>

        {/* Quick Features */}
        <div className="px-6 py-16">
          <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Why Students Love Us</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Simple, fast, and designed for the mobile generation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="text-center p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 animate-slide-up">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Smartphone className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Mobile First</h3>
              <p className="text-sm text-muted-foreground">Order from anywhere on campus with your phone</p>
            </div>

            <div className="text-center p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 animate-slide-up" style={{animationDelay: '0.2s'}}>
              <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-lg font-semibold mb-2">M-Pesa Ready</h3>
              <p className="text-sm text-muted-foreground">Quick and secure payments with M-Pesa</p>
            </div>

            <div className="text-center p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 animate-slide-up" style={{animationDelay: '0.4s'}}>
              <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Skip the Queue</h3>
              <p className="text-sm text-muted-foreground">Pre-order and collect when ready</p>
            </div>
          </div>
        </div>

        {/* How it Works */}
        <div className="px-6 py-16 bg-card/30">
          <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Simple as 1-2-3</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Get your favorite meal in three easy steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center animate-fade-in-up">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-primary-foreground text-xl font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold mb-2">Browse</h3>
              <p className="text-sm text-muted-foreground">Choose from our daily fresh menu</p>
            </div>

            <div className="text-center animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-4 text-success-foreground text-xl font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold mb-2">Pay</h3>
              <p className="text-sm text-muted-foreground">Secure M-Pesa payment in seconds</p>
            </div>

            <div className="text-center animate-fade-in-up" style={{animationDelay: '0.4s'}}>
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4 text-accent-foreground text-xl font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold mb-2">Collect</h3>
              <p className="text-sm text-muted-foreground">Get notified and collect your order</p>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="px-6 py-16">
          <div className="text-center max-w-2xl mx-auto animate-fade-in-up">
            <div className="flex justify-center mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 text-accent fill-current" />
              ))}
            </div>
            <p className="text-lg text-muted-foreground mb-4">
              "SmartMeal has completely changed how we eat at school. No more long queues!"
            </p>
            <p className="text-sm text-primary font-medium">
              - Students across Kenya
            </p>
          </div>
        </div>
      </div>

      {/* Floating Dock Navigation */}
      <div className="floating-dock">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate("/menu")}
            className="dock-icon"
          >
            <Utensils className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => navigate("/admin/login")}
            className="dock-icon"
          >
            <Shield className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => navigate("/menu")}
            className="dock-icon bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <ChefHat className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Index;

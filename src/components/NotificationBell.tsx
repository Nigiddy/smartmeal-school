import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Bell, 
  BellOff, 
  Settings, 
  Volume2, 
  VolumeX, 
  Monitor, 
  X,
  Check,
  Trash2,
  Loader2
} from "lucide-react";
import { useOrderNotifications, OrderNotification } from "@/hooks/use-order-notifications";
import { formatDistanceToNow } from "date-fns";

const NotificationBell = () => {
  const [showSettings, setShowSettings] = useState(false);
  const {
    notifications,
    settings,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    removeNotification,
    updateSettings,
    requestPermission,
    BellIcon,
    BellOffIcon,
    LoaderIcon
  } = useOrderNotifications();

  const handleToggleNotifications = () => {
    updateSettings({ enabled: !settings.enabled });
  };

  const handleToggleSound = () => {
    updateSettings({ sound: !settings.sound });
  };

  const handleToggleDesktop = async () => {
    if (!settings.desktop) {
      const granted = await requestPermission();
      if (granted) {
        updateSettings({ desktop: true });
      }
    } else {
      updateSettings({ desktop: false });
    }
  };

  const handleToggleOrderUpdates = () => {
    updateSettings({ orderUpdates: !settings.orderUpdates });
  };

  const handleTogglePaymentConfirmations = () => {
    updateSettings({ paymentConfirmations: !settings.paymentConfirmations });
  };

  const handleToggleSystemAlerts = () => {
    updateSettings({ systemAlerts: !settings.systemAlerts });
  };

  const getStatusColor = (status: OrderNotification['status']) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500';
      case 'CONFIRMED': return 'bg-blue-500';
      case 'PREPARING': return 'bg-orange-500';
      case 'READY': return 'bg-green-500';
      case 'COMPLETED': return 'bg-green-600';
      case 'CANCELLED': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: OrderNotification['status']) => {
    switch (status) {
      case 'PENDING': return 'Pending';
      case 'CONFIRMED': return 'Confirmed';
      case 'PREPARING': return 'Preparing';
      case 'READY': return 'Ready';
      case 'COMPLETED': return 'Completed';
      case 'CANCELLED': return 'Cancelled';
      default: return status;
    }
  };

  if (!settings.enabled) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggleNotifications}
        className="relative"
      >
        <BellOff className="h-5 w-5" />
        <span className="sr-only">Enable notifications</span>
      </Button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">View notifications</span>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">Notifications</h4>
            {unreadCount > 0 && (
              <Badge variant="secondary">{unreadCount} unread</Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllNotifications}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {showSettings ? (
          <div className="p-4 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications-enabled">Enable Notifications</Label>
                <Switch
                  id="notifications-enabled"
                  checked={settings.enabled}
                  onCheckedChange={handleToggleNotifications}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="sound-enabled">Sound</Label>
                <Switch
                  id="sound-enabled"
                  checked={settings.sound}
                  onCheckedChange={handleToggleSound}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="desktop-enabled">Desktop Notifications</Label>
                <Switch
                  id="desktop-enabled"
                  checked={settings.desktop}
                  onCheckedChange={handleToggleDesktop}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <Label htmlFor="order-updates">Order Updates</Label>
                <Switch
                  id="order-updates"
                  checked={settings.orderUpdates}
                  onCheckedChange={handleToggleOrderUpdates}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="payment-confirmations">Payment Confirmations</Label>
                <Switch
                  id="payment-confirmations"
                  checked={settings.paymentConfirmations}
                  onCheckedChange={handleTogglePaymentConfirmations}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="system-alerts">System Alerts</Label>
                <Switch
                  id="system-alerts"
                  checked={settings.systemAlerts}
                  onCheckedChange={handleToggleSystemAlerts}
                />
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground">
              <p>Desktop notifications require browser permission.</p>
              {!settings.desktop && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={requestPermission}
                  className="mt-2 w-full"
                >
                  Enable Desktop Notifications
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No notifications yet</p>
                <p className="text-sm text-muted-foreground">
                  You'll see order updates and alerts here
                </p>
              </div>
            ) : (
              <>
                <ScrollArea className="h-80">
                  <div className="p-2 space-y-2">
                    {notifications.map((notification) => (
                      <Card 
                        key={notification.id} 
                        className={`cursor-pointer transition-colors ${
                          notification.isRead 
                            ? 'bg-muted/50' 
                            : 'bg-background hover:bg-muted'
                        }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <div className={`w-2 h-2 rounded-full ${getStatusColor(notification.status)}`} />
                                <span className="text-xs font-medium text-muted-foreground">
                                  {getStatusText(notification.status)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                                </span>
                              </div>
                              
                              <p className="text-sm font-medium mb-1">
                                Order #{notification.orderNumber}
                              </p>
                              
                              <p className="text-sm text-muted-foreground">
                                {notification.message}
                              </p>
                              
                              <p className="text-xs text-muted-foreground mt-1">
                                {notification.customerName}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-primary rounded-full" />
                              )}
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeNotification(notification.id);
                                }}
                                className="h-6 w-6 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
                
                {unreadCount > 0 && (
                  <div className="p-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={markAllAsRead}
                      className="w-full"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Mark all as read
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;

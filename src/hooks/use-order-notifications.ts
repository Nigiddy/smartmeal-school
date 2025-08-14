import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Bell, BellOff, Loader2 } from 'lucide-react';

export interface OrderNotification {
  id: string;
  orderNumber: string;
  customerName: string;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  message: string;
  timestamp: Date;
  isRead: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
  orderUpdates: boolean;
  paymentConfirmations: boolean;
  systemAlerts: boolean;
}

export const useOrderNotifications = () => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    sound: true,
    desktop: false,
    orderUpdates: true,
    paymentConfirmations: true,
    systemAlerts: true
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio for notifications
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/notification-sound.mp3');
      audioRef.current.volume = 0.5;
    }
  }, []);

  // Request notification permissions
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      toast({
        title: "Notifications not supported",
        description: "Your browser doesn't support desktop notifications",
        variant: "destructive"
      });
      return false;
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setSettings(prev => ({ ...prev, desktop: true }));
        toast({
          title: "Notifications enabled",
          description: "You'll now receive desktop notifications for order updates",
        });
        return true;
      } else {
        toast({
          title: "Notifications blocked",
          description: "Please enable notifications in your browser settings",
          variant: "destructive"
        });
        return false;
      }
    }

    return Notification.permission === 'granted';
  }, [toast]);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (settings.sound && audioRef.current) {
      try {
        audioRef.current.play().catch(console.error);
      } catch (error) {
        console.error('Error playing notification sound:', error);
      }
    }
  }, [settings.sound]);

  // Show desktop notification
  const showDesktopNotification = useCallback((notification: OrderNotification) => {
    if (settings.desktop && Notification.permission === 'granted') {
      new Notification('SmartMeal Order Update', {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
        requireInteraction: false
      });
    }
  }, [settings.desktop]);

  // Add new notification
  const addNotification = useCallback((notification: Omit<OrderNotification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotification: OrderNotification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      isRead: false
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Show toast notification
    toast({
      title: "Order Update",
      description: notification.message,
    });

    // Play sound if enabled
    playNotificationSound();

    // Show desktop notification if enabled
    showDesktopNotification(newNotification);

    // Auto-remove old notifications (keep last 50)
    setNotifications(prev => prev.slice(0, 50));
  }, [toast, playNotificationSound, showDesktopNotification]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, isRead: true }
          : notif
      )
    );
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
    );
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Remove specific notification
  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  }, []);

  // Update notification settings
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    
    // Request desktop permission if enabling
    if (newSettings.desktop && !settings.desktop) {
      requestPermission();
    }
  }, [settings.desktop, requestPermission]);

  // Simulate real-time order updates (replace with actual WebSocket in production)
  const startOrderMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Simulate order updates every 30 seconds
    intervalRef.current = setInterval(() => {
      // This would be replaced with actual WebSocket events
      // For now, we'll simulate some notifications
      const randomChance = Math.random();
      
      if (randomChance < 0.1) { // 10% chance
        addNotification({
          orderNumber: `ORD-${Math.floor(Math.random() * 10000)}`,
          customerName: "Student",
          status: 'CONFIRMED',
          message: "New order received and confirmed"
        });
      }
    }, 30000);

    setIsConnected(true);
  }, [addNotification]);

  // Stop order monitoring
  const stopOrderMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Initialize notifications
  useEffect(() => {
    if (settings.enabled) {
      startOrderMonitoring();
    } else {
      stopOrderMonitoring();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [settings.enabled, startOrderMonitoring, stopOrderMonitoring]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Get unread count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Get notifications by status
  const getNotificationsByStatus = useCallback((status: OrderNotification['status']) => {
    return notifications.filter(n => n.status === status);
  }, [notifications]);

  // Get recent notifications
  const getRecentNotifications = useCallback((limit: number = 10) => {
    return notifications.slice(0, limit);
  }, [notifications]);

  return {
    // State
    notifications,
    settings,
    isConnected,
    isLoading,
    unreadCount,
    
    // Actions
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    removeNotification,
    updateSettings,
    startOrderMonitoring,
    stopOrderMonitoring,
    requestPermission,
    
    // Utilities
    getNotificationsByStatus,
    getRecentNotifications,
    
    // Icons for UI
    BellIcon: Bell,
    BellOffIcon: BellOff,
    LoaderIcon: Loader2
  };
};

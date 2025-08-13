/**
 * Custom hook for M-Pesa payment processing
 * Handles payment initiation, status checking, and error states
 */

import { useState, useEffect, useCallback } from 'react';
import { MpesaService, apiUtils, ApiError } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export interface PaymentState {
  status: 'idle' | 'initiating' | 'processing' | 'success' | 'failed';
  error?: string;
  checkoutRequestId?: string;
  transactionId?: string;
  progress: number;
}

export interface PaymentData {
  phoneNumber: string;
  amount: number;
  orderId: string;
  description: string;
}

export const useMpesaPayment = () => {
  const { toast } = useToast();
  const [paymentState, setPaymentState] = useState<PaymentState>({
    status: 'idle',
    progress: 0
  });

  const [statusCheckInterval, setStatusCheckInterval] = useState<NodeJS.Timeout | null>(null);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
    };
  }, [statusCheckInterval]);

  /**
   * Validate phone number format
   */
  const validatePhoneNumber = useCallback((phone: string): boolean => {
    if (!phone || phone.length < 10) {
      return false;
    }

    const formatted = apiUtils.formatPhoneNumber(phone);
    return apiUtils.validatePhoneNumber(formatted);
  }, []);

  /**
   * Start payment monitoring
   */
  const startPaymentMonitoring = useCallback((checkoutRequestId: string) => {
    // Clear any existing interval
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
    }

    // Start progress simulation
    let progress = 20;
    const progressInterval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress < 90) {
        setPaymentState(prev => ({ ...prev, progress: Math.min(progress, 90) }));
      }
    }, 2000);

    // Start status checking
    const statusInterval = setInterval(async () => {
      try {
        const statusResult = await MpesaService.checkPaymentStatus(checkoutRequestId);
        
        if (statusResult.status === 'COMPLETED') {
          clearInterval(progressInterval);
          clearInterval(statusInterval);
          setStatusCheckInterval(null);
          
          setPaymentState({
            status: 'success',
            progress: 100,
            transactionId: statusResult.transactionId,
            checkoutRequestId
          });
          
          toast({
            title: 'Payment successful!',
            description: 'Your order has been confirmed',
          });
        } else if (statusResult.status === 'FAILED') {
          clearInterval(progressInterval);
          clearInterval(statusInterval);
          setStatusCheckInterval(null);
          
          setPaymentState({
            status: 'failed',
            progress: 0,
            error: statusResult.resultDesc || 'Payment failed',
            checkoutRequestId
          });
          
          toast({
            title: 'Payment failed',
            description: statusResult.resultDesc || 'Please try again',
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        // Continue checking, don't fail the payment yet
      }
    }, 5000); // Check every 5 seconds

    setStatusCheckInterval(statusInterval);

    // Set a timeout to stop checking after 5 minutes
    setTimeout(() => {
      clearInterval(progressInterval);
      clearInterval(statusInterval);
      setStatusCheckInterval(null);
      
      if (paymentState.status === 'processing') {
        setPaymentState(prev => ({
          ...prev,
          status: 'failed',
          error: 'Payment timeout. Please check your phone and try again.',
          progress: 0
        }));
        
        toast({
          title: 'Payment timeout',
          description: 'Please check your phone and try again',
          variant: 'destructive'
        });
      }
    }, 300000); // 5 minutes
  }, [statusCheckInterval, paymentState.status, toast]);

  /**
   * Initiate M-Pesa payment
   */
  const initiatePayment = useCallback(async (paymentData: PaymentData) => {
    try {
      // Validate phone number
      if (!validatePhoneNumber(paymentData.phoneNumber)) {
        throw new ApiError('Invalid phone number format', 400);
      }

      // Format phone number for M-Pesa
      const formattedPhone = apiUtils.formatPhoneNumber(paymentData.phoneNumber);

      setPaymentState({
        status: 'initiating',
        progress: 0,
        error: undefined
      });

      // Initiate STK Push
      const response = await MpesaService.initiatePayment(
        formattedPhone,
        paymentData.amount,
        paymentData.orderId,
        paymentData.description
      );

      if (response.ResponseCode !== '0') {
        throw new ApiError(response.ResponseDescription || 'Payment initiation failed', 400);
      }

      setPaymentState({
        status: 'processing',
        progress: 20,
        checkoutRequestId: response.CheckoutRequestID,
        error: undefined
      });

      // Start progress simulation and status checking
      startPaymentMonitoring(response.CheckoutRequestID);

      toast({
        title: 'Payment initiated',
        description: 'Please check your phone for M-Pesa prompt',
      });

    } catch (error) {
      console.error('Payment initiation error:', error);
      
      let errorMessage = 'Payment initiation failed';
      if (error instanceof ApiError) {
        errorMessage = error.message;
      }
      
      setPaymentState({
        status: 'failed',
        progress: 0,
        error: errorMessage
      });
      
      toast({
        title: 'Payment failed',
        description: errorMessage,
        variant: 'destructive'
      });
      
      throw error;
    }
  }, [validatePhoneNumber, startPaymentMonitoring, toast]);

  /**
   * Reset payment state
   */
  const resetPayment = useCallback(() => {
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
      setStatusCheckInterval(null);
    }
    
    setPaymentState({
      status: 'idle',
      progress: 0
    });
  }, [statusCheckInterval]);

  /**
   * Cancel payment
   */
  const cancelPayment = useCallback(() => {
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
      setStatusCheckInterval(null);
    }
    
    setPaymentState({
      status: 'failed',
      progress: 0,
      error: 'Payment cancelled by user'
    });
    
    toast({
      title: 'Payment cancelled',
      description: 'You can try again anytime',
    });
  }, [statusCheckInterval, toast]);

  /**
   * Retry payment
   */
  const retryPayment = useCallback(async (paymentData: PaymentData) => {
    resetPayment();
    await initiatePayment(paymentData);
  }, [resetPayment, initiatePayment]);

  return {
    paymentState,
    initiatePayment,
    resetPayment,
    cancelPayment,
    retryPayment,
    validatePhoneNumber
  };
};

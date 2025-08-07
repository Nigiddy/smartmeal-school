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
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Payment initiation failed. Please try again.';

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
  }, [validatePhoneNumber, toast]);

  /**
   * Start monitoring payment status
   */
  const startPaymentMonitoring = useCallback((checkoutRequestId: string) => {
    let progress = 20;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max

    const interval = setInterval(async () => {
      attempts++;
      progress = Math.min(20 + (attempts * 2), 90);

      setPaymentState(prev => ({
        ...prev,
        progress
      }));

      try {
        // Check payment status every 2 seconds
        if (attempts % 2 === 0) {
          const statusResponse = await MpesaService.checkPaymentStatus(checkoutRequestId);
          
          if (statusResponse.status === 'completed') {
            clearInterval(interval);
            setPaymentState({
              status: 'success',
              progress: 100,
              transactionId: statusResponse.transactionId,
              error: undefined
            });
            
            toast({
              title: 'Payment successful!',
              description: `Transaction ID: ${statusResponse.transactionId}`,
            });
          } else if (statusResponse.status === 'failed') {
            clearInterval(interval);
            setPaymentState({
              status: 'failed',
              progress: 0,
              error: 'Payment was declined or failed'
            });
            
            toast({
              title: 'Payment failed',
              description: 'The payment was declined or failed. Please try again.',
              variant: 'destructive'
            });
          }
        }

        // Timeout after max attempts
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setPaymentState({
            status: 'failed',
            progress: 0,
            error: 'Payment timeout. Please check your phone and try again.'
          });
          
          toast({
            title: 'Payment timeout',
            description: 'No response received. Please check your phone and try again.',
            variant: 'destructive'
          });
        }

      } catch (error) {
        console.error('Payment status check failed:', error);
        // Continue monitoring even if status check fails
      }
    }, 1000);

    setStatusCheckInterval(interval);
  }, [toast]);

  /**
   * Reset payment state
   */
  const resetPayment = useCallback(() => {
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
    }
    
    setPaymentState({
      status: 'idle',
      progress: 0,
      error: undefined,
      checkoutRequestId: undefined,
      transactionId: undefined
    });
  }, [statusCheckInterval]);

  /**
   * Cancel payment
   */
  const cancelPayment = useCallback(() => {
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
    }
    
    setPaymentState({
      status: 'failed',
      progress: 0,
      error: 'Payment cancelled by user'
    });
  }, [statusCheckInterval]);

  return {
    paymentState,
    initiatePayment,
    resetPayment,
    cancelPayment,
    validatePhoneNumber
  };
};

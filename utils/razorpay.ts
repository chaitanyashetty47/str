// Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  image?: string;
  order_id?: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    animation?: boolean;
  };
  subscription_id?: string;
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature: string;
  razorpay_subscription_id?: string;
}

// Load the Razorpay script dynamically
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      resolve(false);
    };
    
    document.body.appendChild(script);
  });
};

// Create and open Razorpay checkout
export const openRazorpayCheckout = async (options: RazorpayOptions): Promise<void> => {
  const scriptLoaded = await loadRazorpayScript();
  
  if (!scriptLoaded) {
    throw new Error('Failed to load Razorpay script');
  }
  
  const razorpay = new window.Razorpay(options);
  razorpay.open();
};

// Fetch user's active subscriptions
export const fetchUserSubscriptions = async (): Promise<any> => {
  try {
    // Import getUserSubscriptions function dynamically to avoid server/client module issues
    const { getUserSubscriptions } = await import('@/actions/user-subscription.action');
    const result = await getUserSubscriptions();
    
    return { 
      data: result.subscriptions.data, 
      error: result.subscriptions.error 
    };
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Cancel a subscription
export const cancelSubscription = async (subscriptionId: string): Promise<{ success: boolean; error: string | null }> => {
  try {
    // Import cancelUserSubscription function dynamically to avoid server/client module issues
    const { cancelUserSubscription } = await import('@/actions/user-subscription.action');
    return await cancelUserSubscription(subscriptionId);
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}; 
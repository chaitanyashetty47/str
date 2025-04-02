declare module 'razorpay' {
  export default class Razorpay {
    constructor(options: { key_id: string; key_secret: string });
    
    subscriptions: {
      create: (options: any) => Promise<any>;
      cancel: (subscriptionId: string, cancelAtCycleEnd: boolean) => Promise<any>;
      fetch: (subscriptionId: string) => Promise<any>;
      all: (options?: any) => Promise<any>;
    };

    orders: {
      create: (options: any) => Promise<any>;
      fetch: (orderId: string) => Promise<any>;
      all: (options?: any) => Promise<any>;
    };

    payments: {
      capture: (paymentId: string, amount: number, currency: string) => Promise<any>;
      fetch: (paymentId: string) => Promise<any>;
      all: (options?: any) => Promise<any>;
    };

    customers: {
      create: (options: any) => Promise<any>;
      fetch: (customerId: string) => Promise<any>;
      all: (options?: any) => Promise<any>;
    };
  }
} 
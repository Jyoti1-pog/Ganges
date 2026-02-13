export interface PaymentProvider {
    createPaymentIntent(amount: number, currency: string, metadata: any): Promise<{ id: string; clientSecret?: string }>;
    verifyWebhook(payload: any, signature: string): Promise<boolean>;
}

export class StripeAdapter implements PaymentProvider {
    async createPaymentIntent(amount: number, currency: string, metadata: any) {
        // Mock Stripe Implementation
        console.log(`[Stripe] Creating payment intent for ${amount} ${currency}`);
        return { id: `pi_mock_${Date.now()}`, clientSecret: 'mock_secret' };
    }

    async verifyWebhook(payload: any, signature: string) {
        return true; // Mock
    }
}

export class RazorpayAdapter implements PaymentProvider {
    async createPaymentIntent(amount: number, currency: string, metadata: any) {
        // Mock Razorpay Implementation
        console.log(`[Razorpay] Creating order for ${amount} ${currency}`);
        return { id: `order_mock_${Date.now()}` };
    }

    async verifyWebhook(payload: any, signature: string) {
        return true; // Mock
    }
}

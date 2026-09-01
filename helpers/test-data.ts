export interface CheckoutCustomer { firstName: string; lastName: string; postalCode: string; }
export function createCheckoutCustomer(): CheckoutCustomer { return { firstName: 'Ada', lastName: 'Lovelace', postalCode: '10001' }; }

// src/types/order.ts
export interface Address {
  id?: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber?: string;
  isDefault?: boolean;
}

export interface PaymentMethod {
  id?: string;
  type: 'credit_card' | 'debit_card' | 'paypal' | 'stripe' | 'bank_transfer';
  cardNumber?: string;
  cardHolderName?: string;
  expiryMonth?: number;
  expiryYear?: number;
  cvv?: string;
  isDefault?: boolean;
  last4?: string;
  brand?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
  total: number;
  sku?: string;
  color?: string;
  size?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: PaymentMethod;
  notes?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled'
  | 'Returned'
  | 'Refunded';

export type PaymentStatus =
  | 'Pending'
  | 'Processing'
  | 'Completed'
  | 'Failed'
  | 'Cancelled'
  | 'Refunded';

export interface CheckoutData {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: PaymentMethod;
  notes?: string;
  couponCode?: string;
}

export interface OrderSummary {
  order: Order;
  paymentIntentId?: string;
  clientSecret?: string;
}

export interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  adminOrder: Order | null;
  loading: boolean;
  orderLoading: boolean;
  createLoading: boolean;
  paymentLoading: boolean;
  cancelLoading: boolean;
  updateLoading: boolean;
  adminLoading: boolean;
  error: string | null;
  paymentError: string | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  // Checkout state
  checkoutStep: number;
  shippingAddress: Address | null;
  billingAddress: Address | null;
  paymentMethod: PaymentMethod | null;
  orderSummary: OrderSummary | null;
}
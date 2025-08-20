// src/store/slices/orderSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import agent from '../../services/agent';
import { 
  Order, 
  CheckoutData, 
  OrderState, 
  PaymentMethod, 
  Address,
  OrderSummary 
} from '../../types/order';

interface ProcessPaymentParams {
  orderId: string;
  paymentIntentId: string;
}

interface UpdateOrderStatusParams {
  orderId: string;
  status: string;
}

// Async thunks
export const fetchOrders = createAsyncThunk<
  Order[],
  void,
  { rejectValue: string }
>(
  'orders/fetchOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await agent.orders.getAll();
      return response.data.data || [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch orders');
    }
  }
);

export const fetchOrder = createAsyncThunk<
  Order,
  string,
  { rejectValue: string }
>(
  'orders/fetchOrder',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await agent.orders.get(orderId);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch order');
    }
  }
);

export const createOrder = createAsyncThunk<
  any,
  CheckoutData,
  { rejectValue: string }
>(
  'orders/createOrder',
  async (checkoutData, { rejectWithValue }) => {
    try {
      const response = await agent.orders.checkout(checkoutData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create order');
    }
  }
);

export const processPayment = createAsyncThunk<
  { orderId: string },
  ProcessPaymentParams,
  { rejectValue: string }
>(
  'orders/processPayment',
  async ({ orderId, paymentIntentId }, { rejectWithValue }) => {
    try {
      await agent.orders.payment(orderId, { paymentIntentId });
      return { orderId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Payment processing failed');
    }
  }
);

export const cancelOrder = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  'orders/cancelOrder',
  async (orderId, { rejectWithValue }) => {
    try {
      await agent.orders.cancel(orderId);
      return orderId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to cancel order');
    }
  }
);

export const updateOrderStatus = createAsyncThunk<
  UpdateOrderStatusParams,
  UpdateOrderStatusParams,
  { rejectValue: string }
>(
  'orders/updateOrderStatus',
  async ({ orderId, status }, { rejectWithValue }) => {
    try {
      await agent.orders.updateStatus(orderId, { status });
      return { orderId, status };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update order status');
    }
  }
);

export const fetchAdminOrder = createAsyncThunk<
  Order,
  string,
  { rejectValue: string }
>(
  'orders/fetchAdminOrder',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await agent.orders.adminGet(orderId);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch admin order');
    }
  }
);

const initialState: OrderState = {
  orders: [],
  currentOrder: null,
  adminOrder: null,
  loading: false,
  orderLoading: false,
  createLoading: false,
  paymentLoading: false,
  cancelLoading: false,
  updateLoading: false,
  adminLoading: false,
  error: null,
  paymentError: null,
  currentPage: 1,
  totalPages: 1,
  totalCount: 0,
  pageSize: 10,
  checkoutStep: 1,
  shippingAddress: null,
  billingAddress: null,
  paymentMethod: null,
  orderSummary: null,
};

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
    clearAdminOrder: (state) => {
      state.adminOrder = null;
    },
    clearError: (state) => {
      state.error = null;
      state.paymentError = null;
    },
    setCheckoutStep: (state, action: PayloadAction<number>) => {
      state.checkoutStep = action.payload;
    },
    setShippingAddress: (state, action: PayloadAction<Address>) => {
      state.shippingAddress = action.payload;
    },
    setBillingAddress: (state, action: PayloadAction<Address>) => {
      state.billingAddress = action.payload;
    },
    setPaymentMethod: (state, action: PayloadAction<PaymentMethod>) => {
      state.paymentMethod = action.payload;
    },
    setOrderSummary: (state, action: PayloadAction<OrderSummary>) => {
      state.orderSummary = action.payload;
    },
    resetCheckout: (state) => {
      state.checkoutStep = 1;
      state.shippingAddress = null;
      state.billingAddress = null;
      state.paymentMethod = null;
      state.orderSummary = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Orders
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch orders';
      })
      
      // Fetch Single Order
      .addCase(fetchOrder.pending, (state) => {
        state.orderLoading = true;
        state.error = null;
      })
      .addCase(fetchOrder.fulfilled, (state, action) => {
        state.orderLoading = false;
        state.currentOrder = action.payload;
      })
      .addCase(fetchOrder.rejected, (state, action) => {
        state.orderLoading = false;
        state.error = action.payload || 'Failed to fetch order';
      })
      
      // Create Order
      .addCase(createOrder.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.createLoading = false;
        state.currentOrder = action.payload.data?.order || action.payload.data;
        if (state.currentOrder) {
          state.orders.unshift(state.currentOrder);
        }
        state.orderSummary = action.payload.data;
        state.checkoutStep = 4; // Payment step
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload || 'Failed to create order';
      })
      
      // Process Payment
      .addCase(processPayment.pending, (state) => {
        state.paymentLoading = true;
        state.paymentError = null;
      })
      .addCase(processPayment.fulfilled, (state, action) => {
        state.paymentLoading = false;
        const { orderId } = action.payload;
        const orderIndex = state.orders.findIndex(order => order.id === orderId);
        if (orderIndex !== -1) {
          state.orders[orderIndex].paymentStatus = 'Completed';
          state.orders[orderIndex].status = 'Confirmed';
        }
        if (state.currentOrder?.id === orderId) {
          state.currentOrder.paymentStatus = 'Completed';
          state.currentOrder.status = 'Confirmed';
        }
        state.checkoutStep = 5; // Success step
      })
      .addCase(processPayment.rejected, (state, action) => {
        state.paymentLoading = false;
        state.paymentError = action.payload || 'Payment processing failed';
      })
      
      // Cancel Order
      .addCase(cancelOrder.pending, (state) => {
        state.cancelLoading = true;
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.cancelLoading = false;
        const orderId = action.payload;
        const orderIndex = state.orders.findIndex(order => order.id === orderId);
        if (orderIndex !== -1) {
          state.orders[orderIndex].status = 'Cancelled';
        }
        if (state.currentOrder?.id === orderId) {
          state.currentOrder.status = 'Cancelled';
        }
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.cancelLoading = false;
        state.error = action.payload || 'Failed to cancel order';
      })
      
      // Update Order Status
      .addCase(updateOrderStatus.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.updateLoading = false;
        const { orderId, status } = action.payload;
        const orderIndex = state.orders.findIndex(order => order.id === orderId);
        if (orderIndex !== -1) {
          state.orders[orderIndex].status = status as any;
        }
        if (state.currentOrder?.id === orderId) {
          state.currentOrder.status = status as any;
        }
        if (state.adminOrder?.id === orderId) {
          state.adminOrder.status = status as any;
        }
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload || 'Failed to update order status';
      })
      
      // Fetch Admin Order
      .addCase(fetchAdminOrder.pending, (state) => {
        state.adminLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminOrder.fulfilled, (state, action) => {
        state.adminLoading = false;
        state.adminOrder = action.payload;
      })
      .addCase(fetchAdminOrder.rejected, (state, action) => {
        state.adminLoading = false;
        state.error = action.payload || 'Failed to fetch admin order';
      });
  },
});

export const {
  clearCurrentOrder,
  clearAdminOrder,
  clearError,
  setCheckoutStep,
  setShippingAddress,
  setBillingAddress,
  setPaymentMethod,
  setOrderSummary,
  resetCheckout,
} = orderSlice.actions;

export default orderSlice.reducer;
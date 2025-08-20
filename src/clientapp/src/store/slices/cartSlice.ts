import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import agent from '../../services/agent';
import { AddToCartRequest, CartItem, CartState } from '../../types/cart';

interface UpdateCartItemParams {
  cartItemId: string;
  quantity: number;
}

// Async thunks
export const fetchCartItems = createAsyncThunk<
  CartItem[],
  void,
  { rejectValue: string }
>(
  'cart/fetchCartItems',
  async (_, { rejectWithValue }) => {
    try {
      const response = await agent.cart.get();
      return response.data.data || [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch cart items');
    }
  }
);

export const addToCart = createAsyncThunk<
  CartItem,
  AddToCartRequest,
  { rejectValue: string }
>(
  'cart/addToCart',
  async (request, { rejectWithValue }) => {
    try {
      const response = await agent.cart.addItem(request);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to add item to cart');
    }
  }
);

export const updateCartItem = createAsyncThunk<
  { cartItemId: string; quantity: number },
  UpdateCartItemParams,
  { rejectValue: string }
>(
  'cart/updateCartItem',
  async ({ cartItemId, quantity }, { rejectWithValue }) => {
    try {
      await agent.cart.updateItem(cartItemId, { quantity });
      return { cartItemId, quantity };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update cart item');
    }
  }
);

export const removeFromCart = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  'cart/removeFromCart',
  async (cartItemId, { rejectWithValue }) => {
    try {
      await agent.cart.removeItem(cartItemId);
      return cartItemId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to remove item from cart');
    }
  }
);

export const clearCart = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      await agent.cart.clear();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to clear cart');
    }
  }
);

export const fetchCartTotal = createAsyncThunk<
  number,
  void,
  { rejectValue: string }
>(
  'cart/fetchCartTotal',
  async (_, { rejectWithValue }) => {
    try {
      const response = await agent.cart.total();
      return response.data.data || 0;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch cart total');
    }
  }
);

const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
  loading: false,
  addLoading: false,
  updateLoading: false,
  removeLoading: false,
  clearLoading: false,
  totalLoading: false,
  error: null,
  lastAddedItem: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearLastAddedItem: (state) => {
      state.lastAddedItem = null;
    },
    // Local cart operations (for optimistic updates)
    incrementQuantity: (state, action: PayloadAction<string>) => {
      const item = state.items.find(item => item.id === action.payload);
      if (item) {
        item.quantity += 1;
        item.total = item.price * item.quantity;
        state.total = state.items.reduce((sum, item) => sum + item.total, 0);
        state.itemCount = state.items.reduce((count, item) => count + item.quantity, 0);
      }
    },
    decrementQuantity: (state, action: PayloadAction<string>) => {
      const item = state.items.find(item => item.id === action.payload);
      if (item && item.quantity > 1) {
        item.quantity -= 1;
        item.total = item.price * item.quantity;
        state.total = state.items.reduce((sum, item) => sum + item.total, 0);
        state.itemCount = state.items.reduce((count, item) => count + item.quantity, 0);
      }
    },
    updateItemCount: (state) => {
      state.itemCount = state.items.reduce((count, item) => count + item.quantity, 0);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Cart Items
      .addCase(fetchCartItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCartItems.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.itemCount = state.items.reduce((count, item) => count + item.quantity, 0);
        state.total = state.items.reduce((sum, item) => sum + item.total, 0);
      })
      .addCase(fetchCartItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch cart items';
      })
      
      // Add to Cart
      .addCase(addToCart.pending, (state) => {
        state.addLoading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.addLoading = false;
        const newItem = action.payload;
        const existingItem = state.items.find(item => item.productId === newItem.productId);
        
        if (existingItem) {
          existingItem.quantity = newItem.quantity;
          existingItem.total = newItem.total;
        } else {
          state.items.push(newItem);
        }
        
        state.lastAddedItem = newItem;
        state.itemCount = state.items.reduce((count, item) => count + item.quantity, 0);
        state.total = state.items.reduce((sum, item) => sum + item.total, 0);
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.addLoading = false;
        state.error = action.payload || 'Failed to add item to cart';
      })
      
      // Update Cart Item
      .addCase(updateCartItem.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.updateLoading = false;
        const { cartItemId, quantity } = action.payload;
        const item = state.items.find(item => item.id === cartItemId);
        
        if (item) {
          item.quantity = quantity;
          item.total = item.price * quantity;
          state.itemCount = state.items.reduce((count, item) => count + item.quantity, 0);
          state.total = state.items.reduce((sum, item) => sum + item.total, 0);
        }
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload || 'Failed to update cart item';
      })
      
      // Remove from Cart
      .addCase(removeFromCart.pending, (state) => {
        state.removeLoading = true;
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.removeLoading = false;
        state.items = state.items.filter(item => item.id !== action.payload);
        state.itemCount = state.items.reduce((count, item) => count + item.quantity, 0);
        state.total = state.items.reduce((sum, item) => sum + item.total, 0);
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.removeLoading = false;
        state.error = action.payload || 'Failed to remove item from cart';
      })
      
      // Clear Cart
      .addCase(clearCart.pending, (state) => {
        state.clearLoading = true;
        state.error = null;
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.clearLoading = false;
        state.items = [];
        state.total = 0;
        state.itemCount = 0;
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.clearLoading = false;
        state.error = action.payload || 'Failed to clear cart';
      })
      
      // Fetch Cart Total
      .addCase(fetchCartTotal.pending, (state) => {
        state.totalLoading = true;
      })
      .addCase(fetchCartTotal.fulfilled, (state, action) => {
        state.totalLoading = false;
        state.total = action.payload;
      })
      .addCase(fetchCartTotal.rejected, (state) => {
        state.totalLoading = false;
      });
  },
});

export const {
  clearError,
  clearLastAddedItem,
  incrementQuantity,
  decrementQuantity,
  updateItemCount,
} = cartSlice.actions;

export default cartSlice.reducer;
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import agent from '../../services/agent';
import { WishlistItem, WishlistState } from '../../types/wishlist';

// Async thunks
export const fetchWishlistItems = createAsyncThunk<
  WishlistItem[],
  void,
  { rejectValue: string }
>(
  'wishlist/fetchWishlistItems',
  async (_, { rejectWithValue }) => {
    try {
      const response = await agent.wishlist.get();
      return response.data.data || [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch wishlist items');
    }
  }
);

export const addToWishlist = createAsyncThunk<
  WishlistItem,
  string,
  { rejectValue: string }
>(
  'wishlist/addToWishlist',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await agent.wishlist.addItem(productId);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to add item to wishlist');
    }
  }
);

export const removeFromWishlist = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  'wishlist/removeFromWishlist',
  async (productId, { rejectWithValue }) => {
    try {
      await agent.wishlist.removeItem(productId);
      return productId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to remove item from wishlist');
    }
  }
);

export const clearWishlist = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>(
  'wishlist/clearWishlist',
  async (_, { rejectWithValue }) => {
    try {
      await agent.wishlist.clear();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to clear wishlist');
    }
  }
);

export const checkIsInWishlist = createAsyncThunk<
  { productId: string; isInWishlist: boolean },
  string,
  { rejectValue: string }
>(
  'wishlist/checkIsInWishlist',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await agent.wishlist.isInWishlist(productId);
      return { productId, isInWishlist: response.data.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to check wishlist status');
    }
  }
);

const initialState: WishlistState = {
  items: [],
  itemCount: 0,
  loading: false,
  addLoading: false,
  removeLoading: false,
  clearLoading: false,
  checkLoading: false,
  error: null,
  checkedProducts: {},
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateItemCount: (state) => {
      state.itemCount = state.items.length;
    },
    toggleWishlistItem: (state, action: PayloadAction<string>) => {
      const productId = action.payload;
      const existingItem = state.items.find(item => item.productId === productId);
      
      if (existingItem) {
        state.items = state.items.filter(item => item.productId !== productId);
        state.checkedProducts[productId] = false;
      } else {
        state.checkedProducts[productId] = true;
      }
      state.itemCount = state.items.length;
    },
    setProductWishlistStatus: (state, action: PayloadAction<{ productId: string; isInWishlist: boolean }>) => {
      const { productId, isInWishlist } = action.payload;
      state.checkedProducts[productId] = isInWishlist;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Wishlist Items
      .addCase(fetchWishlistItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWishlistItems.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.itemCount = state.items.length;
        
        state.checkedProducts = {};
        state.items.forEach(item => {
          state.checkedProducts[item.productId] = true;
        });
      })
      .addCase(fetchWishlistItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch wishlist items';
      })
      
      // Add to Wishlist
      .addCase(addToWishlist.pending, (state) => {
        state.addLoading = true;
        state.error = null;
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        state.addLoading = false;
        const newItem = action.payload;
        const existingItem = state.items.find(item => item.productId === newItem.productId);
        
        if (!existingItem) {
          state.items.push(newItem);
          state.itemCount = state.items.length;
          state.checkedProducts[newItem.productId] = true;
        }
      })
      .addCase(addToWishlist.rejected, (state, action) => {
        state.addLoading = false;
        state.error = action.payload || 'Failed to add item to wishlist';
      })
      
      // Remove from Wishlist
      .addCase(removeFromWishlist.pending, (state) => {
        state.removeLoading = true;
        state.error = null;
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.removeLoading = false;
        const productId = action.payload;
        state.items = state.items.filter(item => item.productId !== productId);
        state.itemCount = state.items.length;
        state.checkedProducts[productId] = false;
      })
      .addCase(removeFromWishlist.rejected, (state, action) => {
        state.removeLoading = false;
        state.error = action.payload || 'Failed to remove item from wishlist';
      })
      
      // Clear Wishlist
      .addCase(clearWishlist.pending, (state) => {
        state.clearLoading = true;
        state.error = null;
      })
      .addCase(clearWishlist.fulfilled, (state) => {
        state.clearLoading = false;
        state.items = [];
        state.itemCount = 0;
        state.checkedProducts = {};
      })
      .addCase(clearWishlist.rejected, (state, action) => {
        state.clearLoading = false;
        state.error = action.payload || 'Failed to clear wishlist';
      })
      
      // Check if Product is in Wishlist
      .addCase(checkIsInWishlist.pending, (state) => {
        state.checkLoading = true;
      })
      .addCase(checkIsInWishlist.fulfilled, (state, action) => {
        state.checkLoading = false;
        const { productId, isInWishlist } = action.payload;
        state.checkedProducts[productId] = isInWishlist;
      })
      .addCase(checkIsInWishlist.rejected, (state) => {
        state.checkLoading = false;
      });
  },
});

export const {
  clearError,
  updateItemCount,
  toggleWishlistItem,
  setProductWishlistStatus,
} = wishlistSlice.actions;

export default wishlistSlice.reducer;
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import agent from '../../services/agent';
import { Product } from '../../types/product';
import { Review, CreateReviewRequest, ReviewState } from '../../types/review';

interface FetchProductReviewsParams {
  productId: string;
  page?: number;
  pageSize?: number;
}

interface FetchAllReviewsParams {
  page?: number;
  pageSize?: number;
}

// Async thunks
export const fetchProductReviews = createAsyncThunk<
  { productId: string; data: Review[] },
  FetchProductReviewsParams,
  { rejectValue: string }
>(
  'reviews/fetchProductReviews',
  async ({ productId, page = 1, pageSize = 10 }, { rejectWithValue }) => {
    try {
      const response = await agent.reviews.getForProduct(productId, page, pageSize);
      return { productId, data: response.data.data || [] };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch product reviews');
    }
  }
);

export const fetchAllReviews = createAsyncThunk<
  Review[],
  FetchAllReviewsParams,
  { rejectValue: string }
>(
  'reviews/fetchAllReviews',
  async ({ page = 1, pageSize = 10 } = {}, { rejectWithValue }) => {
    try {
      const response = await agent.reviews.getAll(page, pageSize);
      return response.data.data || [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch reviews');
    }
  }
);

export const fetchUserReviews = createAsyncThunk<
  Review[],
  string,
  { rejectValue: string }
>(
  'reviews/fetchUserReviews',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await agent.reviews.getByUser(userId);
      return response.data.data || [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch user reviews');
    }
  }
);

export const createReview = createAsyncThunk<
  Review,
  CreateReviewRequest,
  { rejectValue: string }
>(
  'reviews/createReview',
  async (reviewData, { rejectWithValue }) => {
    try {
      const response = await agent.reviews.add(reviewData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create review');
    }
  }
);

export const approveReview = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  'reviews/approveReview',
  async (reviewId, { rejectWithValue }) => {
    try {
      await agent.reviews.approve(reviewId);
      return reviewId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to approve review');
    }
  }
);

export const deleteReview = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  'reviews/deleteReview',
  async (reviewId, { rejectWithValue }) => {
    try {
      await agent.reviews.delete(reviewId);
      return reviewId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to delete review');
    }
  }
);

const initialState: ReviewState = {
  productReviews: {},
  productReviewsLoading: {},
  productReviewsError: {},
  allReviews: [],
  allReviewsLoading: false,
  allReviewsError: null,
  userReviews: [],
  userReviewsLoading: false,
  userReviewsError: null,
  createLoading: false,
  approveLoading: false,
  deleteLoading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  totalCount: 0,
  pageSize: 10,
  isReviewFormOpen: false,
  selectedProductForReview: null,
};

const reviewSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.allReviewsError = null;
      state.userReviewsError = null;
    },
    clearProductReviewsError: (state, action: PayloadAction<string>) => {
      const productId = action.payload;
      if (state.productReviewsError[productId]) {
        delete state.productReviewsError[productId];
      }
    },
    setReviewFormOpen: (state, action: PayloadAction<boolean>) => {
      state.isReviewFormOpen = action.payload;
    },
    setSelectedProductForReview: (state, action: PayloadAction<Product | null>) => {
      state.selectedProductForReview = action.payload;
    },
    clearSelectedProductForReview: (state) => {
      state.selectedProductForReview = null;
      state.isReviewFormOpen = false;
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Product Reviews
      .addCase(fetchProductReviews.pending, (state, action) => {
        const productId = action.meta.arg.productId;
        state.productReviewsLoading[productId] = true;
        if (state.productReviewsError[productId]) {
          delete state.productReviewsError[productId];
        }
      })
      .addCase(fetchProductReviews.fulfilled, (state, action) => {
        const { productId, data } = action.payload;
        state.productReviewsLoading[productId] = false;
        state.productReviews[productId] = data;
      })
      .addCase(fetchProductReviews.rejected, (state, action) => {
        const productId = action.meta.arg.productId;
        state.productReviewsLoading[productId] = false;
        state.productReviewsError[productId] = action.payload || 'Failed to fetch product reviews';
      })
      
      // Fetch All Reviews
      .addCase(fetchAllReviews.pending, (state) => {
        state.allReviewsLoading = true;
        state.allReviewsError = null;
      })
      .addCase(fetchAllReviews.fulfilled, (state, action) => {
        state.allReviewsLoading = false;
        state.allReviews = action.payload;
      })
      .addCase(fetchAllReviews.rejected, (state, action) => {
        state.allReviewsLoading = false;
        state.allReviewsError = action.payload || 'Failed to fetch reviews';
      })
      
      // Fetch User Reviews
      .addCase(fetchUserReviews.pending, (state) => {
        state.userReviewsLoading = true;
        state.userReviewsError = null;
      })
      .addCase(fetchUserReviews.fulfilled, (state, action) => {
        state.userReviewsLoading = false;
        state.userReviews = action.payload;
      })
      .addCase(fetchUserReviews.rejected, (state, action) => {
        state.userReviewsLoading = false;
        state.userReviewsError = action.payload || 'Failed to fetch user reviews';
      })
      
      // Create Review
      .addCase(createReview.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.createLoading = false;
        const newReview = action.payload;
        
        state.allReviews.unshift(newReview);
        state.userReviews.unshift(newReview);
        
        if (newReview.productId && state.productReviews[newReview.productId]) {
          state.productReviews[newReview.productId].unshift(newReview);
        }
        
        state.isReviewFormOpen = false;
        state.selectedProductForReview = null;
      })
      .addCase(createReview.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload || 'Failed to create review';
      })
      
      // Approve Review
      .addCase(approveReview.pending, (state) => {
        state.approveLoading = true;
        state.error = null;
      })
      .addCase(approveReview.fulfilled, (state, action) => {
        state.approveLoading = false;
        const reviewId = action.payload;
        
        const allReviewIndex = state.allReviews.findIndex(r => r.id === reviewId);
        if (allReviewIndex !== -1) {
          state.allReviews[allReviewIndex].isApproved = true;
        }
        
        const userReviewIndex = state.userReviews.findIndex(r => r.id === reviewId);
        if (userReviewIndex !== -1) {
          state.userReviews[userReviewIndex].isApproved = true;
        }
        
        Object.keys(state.productReviews).forEach(productId => {
          const productReviewIndex = state.productReviews[productId].findIndex(r => r.id === reviewId);
          if (productReviewIndex !== -1) {
            state.productReviews[productId][productReviewIndex].isApproved = true;
          }
        });
      })
      .addCase(approveReview.rejected, (state, action) => {
        state.approveLoading = false;
        state.error = action.payload || 'Failed to approve review';
      })
      
      // Delete Review
      .addCase(deleteReview.pending, (state) => {
        state.deleteLoading = true;
        state.error = null;
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.deleteLoading = false;
        const reviewId = action.payload;
        
        state.allReviews = state.allReviews.filter(r => r.id !== reviewId);
        state.userReviews = state.userReviews.filter(r => r.id !== reviewId);
        
        Object.keys(state.productReviews).forEach(productId => {
          state.productReviews[productId] = state.productReviews[productId].filter(r => r.id !== reviewId);
        });
      })
      .addCase(deleteReview.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload || 'Failed to delete review';
      });
  },
});

export const {
  clearError,
  clearProductReviewsError,
  setReviewFormOpen,
  setSelectedProductForReview,
  clearSelectedProductForReview,
  setCurrentPage,
} = reviewSlice.actions;

export default reviewSlice.reducer;
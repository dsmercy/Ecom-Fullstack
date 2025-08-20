import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import agent from '../../services/agent';
import { ApiResponse } from '../../types/api';
import { ProductFilters, Product, ProductState } from '../../types/product';

interface FetchProductsParams extends ProductFilters {
  page?: number;
  pageSize?: number;
}

interface SearchProductsParams {
  query: string;
  filters?: ProductFilters;
}

interface FetchProductsByCategoryParams {
  categoryId: string;
  params?: ProductFilters;
}

interface UpdateProductParams {
  id: string;
  productData: Partial<Product>;
}

// Define the paginated response type
interface PaginatedProductResponse {
  items?: Product[];
  data?: Product[];
  totalCount?: number;
  totalPages?: number;
  page?: number;
}

// Async thunks
export const fetchProducts = createAsyncThunk<
  PaginatedProductResponse,
  FetchProductsParams,
  { rejectValue: string }
>(
  'products/fetchProducts',
  async (searchParams = {}, { rejectWithValue }) => {
    try {
      const response = await agent.products.getAll(searchParams);
      const responseData = response.data.data || response.data;
      
      // Normalize response to always return PaginatedProductResponse structure
      if (Array.isArray(responseData)) {
        // If response is a simple array, wrap it in pagination structure
        return {
          items: responseData,
          data: responseData,
          totalCount: responseData.length,
          totalPages: 1,
          page: 1
        };
      } else {
        // If response is already paginated, return as is
        return responseData as PaginatedProductResponse;
      }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch products'
      );
    }
  }
);

export const fetchProduct = createAsyncThunk<
  Product,
  string,
  { rejectValue: string }
>(
  'products/fetchProduct',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await agent.products.get(productId);
      const responseData = response.data.data || response.data;
      return responseData as Product;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch product'
      );
    }
  }
);

export const searchProducts = createAsyncThunk<
  Product[],
  SearchProductsParams,
  { rejectValue: string }
>(
  'products/searchProducts',
  async ({ query, filters = {} }, { rejectWithValue }) => {
    try {
      const response = await agent.products.search(query, filters);
      const responseData = response.data.data || response.data;
      return Array.isArray(responseData) ? responseData : [];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Search failed'
      );
    }
  }
);

export const fetchFeaturedProducts = createAsyncThunk<
  Product[],
  void,
  { rejectValue: string }
>(
  'products/fetchFeaturedProducts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await agent.products.featured();
      const responseData = response.data.data || response.data;
      return Array.isArray(responseData) ? responseData : [];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch featured products'
      );
    }
  }
);

export const fetchRelatedProducts = createAsyncThunk<
  Product[],
  string,
  { rejectValue: string }
>(
  'products/fetchRelatedProducts',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await agent.products.related(productId);
      const responseData = response.data.data || response.data;
      return Array.isArray(responseData) ? responseData : [];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch related products'
      );
    }
  }
);

export const fetchProductsByCategory = createAsyncThunk<
  Product[],
  FetchProductsByCategoryParams,
  { rejectValue: string }
>(
  'products/fetchProductsByCategory',
  async ({ categoryId, params = {} }, { rejectWithValue }) => {
    try {
      const response = await agent.products.byCategory(categoryId, params);
      const responseData = response.data.data || response.data;
      return Array.isArray(responseData) ? responseData : [];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch products by category'
      );
    }
  }
);

export const createProduct = createAsyncThunk<
  Product,
  Partial<Product>,
  { rejectValue: string }
>(
  'products/createProduct',
  async (productData, { rejectWithValue }) => {
    try {
      const response = await agent.products.add(productData);
      const responseData = response.data.data || response.data;
      return responseData as Product;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Failed to create product'
      );
    }
  }
);

export const updateProduct = createAsyncThunk<
  Product,
  UpdateProductParams,
  { rejectValue: string }
>(
  'products/updateProduct',
  async ({ id, productData }, { rejectWithValue }) => {
    try {
      const response = await agent.products.update(id, productData);
      const responseData = response.data.data || response.data;
      return responseData as Product;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Failed to update product'
      );
    }
  }
);

export const deleteProduct = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  'products/deleteProduct',
  async (productId, { rejectWithValue }) => {
    try {
      await agent.products.delete(productId);
      return productId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Failed to delete product'
      );
    }
  }
);

const initialState: ProductState = {
  products: [],
  currentProduct: null,
  featuredProducts: [],
  relatedProducts: [],
  searchResults: [],
  categoryProducts: [],
  loading: false,
  searchLoading: false,
  featuredLoading: false,
  relatedLoading: false,
  categoryLoading: false,
  currentProductLoading: false,
  createLoading: false,
  updateLoading: false,
  deleteLoading: false,
  error: null,
  searchError: null,
  currentPage: 1,
  totalPages: 1,
  totalCount: 0,
  pageSize: 12,
  filters: {
    search: '',
    categoryId: '',
    minPrice: undefined,
    maxPrice: undefined,
    minRating: undefined,
    sortBy: 'name',
    sortOrder: 'asc',
  },
};

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchError = null;
    },
    clearError: (state) => {
      state.error = null;
      state.searchError = null;
    },
    setFilters: (state, action: PayloadAction<Partial<ProductFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload;
        
        // Handle both paginated and simple array responses
        if (Array.isArray(data)) {
          state.products = data;
          state.totalCount = data.length;
          state.totalPages = 1;
          state.currentPage = 1;
        } else {
          state.products = data?.items || data?.data || [];
          state.totalCount = data?.totalCount || 0;
          state.totalPages = data?.totalPages || 1;
          state.currentPage = data?.page || 1;
        }
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch products';
      })
      
      // Fetch Single Product
      .addCase(fetchProduct.pending, (state) => {
        state.currentProductLoading = true;
        state.error = null;
      })
      .addCase(fetchProduct.fulfilled, (state, action) => {
        state.currentProductLoading = false;
        state.currentProduct = action.payload;
      })
      .addCase(fetchProduct.rejected, (state, action) => {
        state.currentProductLoading = false;
        state.error = action.payload || 'Failed to fetch product';
      })
      
      // Search Products
      .addCase(searchProducts.pending, (state) => {
        state.searchLoading = true;
        state.searchError = null;
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload || [];
      })
      .addCase(searchProducts.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchError = action.payload || 'Search failed';
      })
      
      // Featured Products
      .addCase(fetchFeaturedProducts.pending, (state) => {
        state.featuredLoading = true;
      })
      .addCase(fetchFeaturedProducts.fulfilled, (state, action) => {
        state.featuredLoading = false;
        state.featuredProducts = action.payload || [];
      })
      .addCase(fetchFeaturedProducts.rejected, (state) => {
        state.featuredLoading = false;
      })
      
      // Related Products
      .addCase(fetchRelatedProducts.pending, (state) => {
        state.relatedLoading = true;
      })
      .addCase(fetchRelatedProducts.fulfilled, (state, action) => {
        state.relatedLoading = false;
        state.relatedProducts = action.payload || [];
      })
      .addCase(fetchRelatedProducts.rejected, (state) => {
        state.relatedLoading = false;
      })
      
      // Products by Category
      .addCase(fetchProductsByCategory.pending, (state) => {
        state.categoryLoading = true;
      })
      .addCase(fetchProductsByCategory.fulfilled, (state, action) => {
        state.categoryLoading = false;
        state.categoryProducts = action.payload || [];
      })
      .addCase(fetchProductsByCategory.rejected, (state) => {
        state.categoryLoading = false;
      })
      
      // Create Product
      .addCase(createProduct.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.createLoading = false;
        if (action.payload) {
          state.products.unshift(action.payload);
        }
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload || 'Failed to create product';
      })
      
      // Update Product
      .addCase(updateProduct.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.updateLoading = false;
        if (action.payload) {
          const index = state.products.findIndex(p => p.id === action.payload.id);
          if (index !== -1) {
            state.products[index] = action.payload;
          }
          if (state.currentProduct?.id === action.payload.id) {
            state.currentProduct = action.payload;
          }
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload || 'Failed to update product';
      })
      
      // Delete Product
      .addCase(deleteProduct.pending, (state) => {
        state.deleteLoading = true;
        state.error = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.deleteLoading = false;
        if (action.payload) {
          state.products = state.products.filter(p => p.id !== action.payload);
        }
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload || 'Failed to delete product';
      });
  },
});

export const {
  clearCurrentProduct,
  clearSearchResults,
  clearError,
  setFilters,
  clearFilters,
  setCurrentPage,
} = productSlice.actions;

export default productSlice.reducer;
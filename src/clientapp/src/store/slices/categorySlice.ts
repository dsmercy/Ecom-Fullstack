import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import agent from '../../services/agent';
import { Category } from '../../types/product';
import { CategoryState } from '../../types';

interface UpdateCategoryParams {
  id: string;
  categoryData: Partial<Category>;
}

// Async thunks
export const fetchCategories = createAsyncThunk<
  Category[],
  void,
  { rejectValue: string }
>(
  'categories/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await agent.categories.getAll();
      return response.data.data || [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch categories');
    }
  }
);

export const fetchCategory = createAsyncThunk<
  Category,
  string,
  { rejectValue: string }
>(
  'categories/fetchCategory',
  async (categoryId, { rejectWithValue }) => {
    try {
      const response = await agent.categories.get(categoryId);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch category');
    }
  }
);

export const fetchSubcategories = createAsyncThunk<
  Category[],
  string,
  { rejectValue: string }
>(
  'categories/fetchSubcategories',
  async (categoryId, { rejectWithValue }) => {
    try {
      const response = await agent.categories.subcategories(categoryId);
      return response.data.data || [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch subcategories');
    }
  }
);

export const createCategory = createAsyncThunk<
  Category,
  Partial<Category>,
  { rejectValue: string }
>(
  'categories/createCategory',
  async (categoryData, { rejectWithValue }) => {
    try {
      const response = await agent.categories.add(categoryData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create category');
    }
  }
);

export const updateCategory = createAsyncThunk<
  Category,
  UpdateCategoryParams,
  { rejectValue: string }
>(
  'categories/updateCategory',
  async ({ id, categoryData }, { rejectWithValue }) => {
    try {
      const response = await agent.categories.update(id, categoryData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update category');
    }
  }
);

export const deleteCategory = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  'categories/deleteCategory',
  async (categoryId, { rejectWithValue }) => {
    try {
      await agent.categories.delete(categoryId);
      return categoryId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to delete category');
    }
  }
);

const initialState: CategoryState = {
  categories: [],
  currentCategory: null,
  subcategories: [],
  loading: false,
  categoryLoading: false,
  subcategoryLoading: false,
  createLoading: false,
  updateLoading: false,
  deleteLoading: false,
  error: null,
  selectedCategoryId: null,
};

const categorySlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    clearCurrentCategory: (state) => {
      state.currentCategory = null;
    },
    clearSubcategories: (state) => {
      state.subcategories = [];
    },
    clearError: (state) => {
      state.error = null;
    },
    setSelectedCategory: (state, action: PayloadAction<string | null>) => {
      state.selectedCategoryId = action.payload;
    },
    clearSelectedCategory: (state) => {
      state.selectedCategoryId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Categories
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch categories';
      })
      
      // Fetch Single Category
      .addCase(fetchCategory.pending, (state) => {
        state.categoryLoading = true;
        state.error = null;
      })
      .addCase(fetchCategory.fulfilled, (state, action) => {
        state.categoryLoading = false;
        state.currentCategory = action.payload;
      })
      .addCase(fetchCategory.rejected, (state, action) => {
        state.categoryLoading = false;
        state.error = action.payload || 'Failed to fetch category';
      })
      
      // Fetch Subcategories
      .addCase(fetchSubcategories.pending, (state) => {
        state.subcategoryLoading = true;
        state.error = null;
      })
      .addCase(fetchSubcategories.fulfilled, (state, action) => {
        state.subcategoryLoading = false;
        state.subcategories = action.payload;
      })
      .addCase(fetchSubcategories.rejected, (state, action) => {
        state.subcategoryLoading = false;
        state.error = action.payload || 'Failed to fetch subcategories';
      })
      
      // Create Category
      .addCase(createCategory.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.createLoading = false;
        const newCategory = action.payload;
        if (newCategory.parentCategoryId) {
          state.subcategories.push(newCategory);
        } else {
          state.categories.push(newCategory);
        }
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload || 'Failed to create category';
      })
      
      // Update Category
      .addCase(updateCategory.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.updateLoading = false;
        const updatedCategory = action.payload;
        
        const categoryIndex = state.categories.findIndex(c => c.id === updatedCategory.id);
        if (categoryIndex !== -1) {
          state.categories[categoryIndex] = updatedCategory;
        }
        
        const subcategoryIndex = state.subcategories.findIndex(c => c.id === updatedCategory.id);
        if (subcategoryIndex !== -1) {
          state.subcategories[subcategoryIndex] = updatedCategory;
        }
        
        if (state.currentCategory?.id === updatedCategory.id) {
          state.currentCategory = updatedCategory;
        }
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload || 'Failed to update category';
      })
      
      // Delete Category
      .addCase(deleteCategory.pending, (state) => {
        state.deleteLoading = true;
        state.error = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.deleteLoading = false;
        const categoryId = action.payload;
        
        state.categories = state.categories.filter(c => c.id !== categoryId);
        state.subcategories = state.subcategories.filter(c => c.id !== categoryId);
        
        if (state.currentCategory?.id === categoryId) {
          state.currentCategory = null;
        }
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload || 'Failed to delete category';
      });
  },
});

export const {
  clearCurrentCategory,
  clearSubcategories,
  clearError,
  setSelectedCategory,
  clearSelectedCategory,
} = categorySlice.actions;

export default categorySlice.reducer;
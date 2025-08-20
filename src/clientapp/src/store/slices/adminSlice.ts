import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { DashboardData, Promotion, CreatePromotionRequest, SalesAnalytics, AdminState } from '../../types/admin';
import agent from '../../services/agent';
import { User } from '../../types/auth';
import { Order } from '../../types/order';

interface FetchUsersParams {
  page?: number;
  pageSize?: number;
}

interface UpdateUserStatusParams {
  userId: string;
  isActive: boolean;
}

interface FetchOrdersParams {
  page?: number;
  pageSize?: number;
}

interface FetchSalesAnalyticsParams {
  startDate: string;
  endDate: string;
}

// Async thunks
export const fetchDashboardData = createAsyncThunk<
  DashboardData,
  void,
  { rejectValue: string }
>(
  'admin/fetchDashboardData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await agent.admin.dashboard();
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch dashboard data');
    }
  }
);

export const fetchUsers = createAsyncThunk<
  { users: User[]; totalUsers: number; page: number; pageSize: number },
  FetchUsersParams,
  { rejectValue: string }
>(
  'admin/fetchUsers',
  async ({ page = 1, pageSize = 10 } = {}, { rejectWithValue }) => {
    try {
      const response = await agent.admin.users(page, pageSize);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch users');
    }
  }
);

export const updateUserStatus = createAsyncThunk<
  UpdateUserStatusParams,
  UpdateUserStatusParams,
  { rejectValue: string }
>(
  'admin/updateUserStatus',
  async ({ userId, isActive }, { rejectWithValue }) => {
    try {
      await agent.admin.updateUserStatus(userId, { isActive });
      return { userId, isActive };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update user status');
    }
  }
);

export const fetchAdminOrders = createAsyncThunk<
  { orders: Order[]; totalOrders: number; page: number; pageSize: number },
  FetchOrdersParams,
  { rejectValue: string }
>(
  'admin/fetchOrders',
  async ({ page = 1, pageSize = 10 } = {}, { rejectWithValue }) => {
    try {
      const response = await agent.admin.orders(page, pageSize);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch orders');
    }
  }
);

export const createPromotion = createAsyncThunk<
  Promotion,
  CreatePromotionRequest,
  { rejectValue: string }
>(
  'admin/createPromotion',
  async (promotionData, { rejectWithValue }) => {
    try {
      const response = await agent.admin.addPromotion(promotionData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create promotion');
    }
  }
);

export const fetchSalesAnalytics = createAsyncThunk<
  SalesAnalytics,
  FetchSalesAnalyticsParams,
  { rejectValue: string }
>(
  'admin/fetchSalesAnalytics',
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      const response = await agent.admin.salesAnalytics(startDate, endDate);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch sales analytics');
    }
  }
);

const initialState: AdminState = {
  dashboardData: {
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    lowStockProducts: [],
  },
  dashboardLoading: false,
  dashboardError: null,
  users: [],
  usersLoading: false,
  usersError: null,
  userUpdateLoading: false,
  totalUsers: 0,
  usersPage: 1,
  usersPageSize: 10,
  orders: [],
  ordersLoading: false,
  ordersError: null,
  totalOrders: 0,
  ordersPage: 1,
  ordersPageSize: 10,
  promotions: [],
  promotionCreateLoading: false,
  promotionError: null,
  salesAnalytics: {
    salesByDay: [],
    topProducts: [],
  },
  analyticsLoading: false,
  analyticsError: null,
  error: null,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.dashboardError = null;
      state.usersError = null;
      state.ordersError = null;
      state.promotionError = null;
      state.analyticsError = null;
    },
    clearDashboardError: (state) => {
      state.dashboardError = null;
    },
    clearUsersError: (state) => {
      state.usersError = null;
    },
    clearOrdersError: (state) => {
      state.ordersError = null;
    },
    clearPromotionError: (state) => {
      state.promotionError = null;
    },
    clearAnalyticsError: (state) => {
      state.analyticsError = null;
    },
    setUsersPage: (state, action: PayloadAction<number>) => {
      state.usersPage = action.payload;
    },
    setOrdersPage: (state, action: PayloadAction<number>) => {
      state.ordersPage = action.payload;
    },
    updateUserStatusLocally: (state, action: PayloadAction<UpdateUserStatusParams>) => {
      const { userId, isActive } = action.payload;
      const user = state.users.find(u => u.id === userId);
      if (user) {
        user.isActive = isActive;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Dashboard Data
      .addCase(fetchDashboardData.pending, (state) => {
        state.dashboardLoading = true;
        state.dashboardError = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.dashboardLoading = false;
        state.dashboardData = action.payload;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.dashboardLoading = false;
        state.dashboardError = action.payload || 'Failed to fetch dashboard data';
      })
      
      // Fetch Users
      .addCase(fetchUsers.pending, (state) => {
        state.usersLoading = true;
        state.usersError = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.usersLoading = false;
        const data = action.payload;
        state.users = data.users || [];
        state.totalUsers = data.totalUsers || 0;
        state.usersPage = data.page || 1;
        state.usersPageSize = data.pageSize || 10;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.usersLoading = false;
        state.usersError = action.payload || 'Failed to fetch users';
      })
      
      // Update User Status
      .addCase(updateUserStatus.pending, (state) => {
        state.userUpdateLoading = true;
        state.usersError = null;
      })
      .addCase(updateUserStatus.fulfilled, (state, action) => {
        state.userUpdateLoading = false;
        const { userId, isActive } = action.payload;
        const user = state.users.find(u => u.id === userId);
        if (user) {
          user.isActive = isActive;
        }
      })
      .addCase(updateUserStatus.rejected, (state, action) => {
        state.userUpdateLoading = false;
        state.usersError = action.payload || 'Failed to update user status';
      })
      
      // Fetch Admin Orders
      .addCase(fetchAdminOrders.pending, (state) => {
        state.ordersLoading = true;
        state.ordersError = null;
      })
      .addCase(fetchAdminOrders.fulfilled, (state, action) => {
        state.ordersLoading = false;
        const data = action.payload;
        state.orders = data.orders || [];
        state.totalOrders = data.totalOrders || 0;
        state.ordersPage = data.page || 1;
        state.ordersPageSize = data.pageSize || 10;
      })
      .addCase(fetchAdminOrders.rejected, (state, action) => {
        state.ordersLoading = false;
        state.ordersError = action.payload || 'Failed to fetch orders';
      })
      
      // Create Promotion
      .addCase(createPromotion.pending, (state) => {
        state.promotionCreateLoading = true;
        state.promotionError = null;
      })
      .addCase(createPromotion.fulfilled, (state, action) => {
        state.promotionCreateLoading = false;
        const newPromotion = action.payload;
        state.promotions.unshift(newPromotion);
      })
      .addCase(createPromotion.rejected, (state, action) => {
        state.promotionCreateLoading = false;
        state.promotionError = action.payload || 'Failed to create promotion';
      })
      
      // Fetch Sales Analytics
      .addCase(fetchSalesAnalytics.pending, (state) => {
        state.analyticsLoading = true;
        state.analyticsError = null;
      })
      .addCase(fetchSalesAnalytics.fulfilled, (state, action) => {
        state.analyticsLoading = false;
        state.salesAnalytics = action.payload;
      })
      .addCase(fetchSalesAnalytics.rejected, (state, action) => {
        state.analyticsLoading = false;
        state.analyticsError = action.payload || 'Failed to fetch sales analytics';
      });
  },
});

export const {
  clearError,
  clearDashboardError,
  clearUsersError,
  clearOrdersError,
  clearPromotionError,
  clearAnalyticsError,
  setUsersPage,
  setOrdersPage,
  updateUserStatusLocally,
} = adminSlice.actions;

export default adminSlice.reducer;
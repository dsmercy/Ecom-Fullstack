// src/store/slices/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import agent from '../../services/agent';
import { User, RegisterData, LoginCredentials, ChangePasswordData, AuthState } from '../../types/auth';

// Async thunks with proper data extraction
export const register = createAsyncThunk<
  { user: User; token: string },
  RegisterData,
  { rejectValue: string }
>(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      debugger;
      const response = await agent.auth.register(userData);
      // Extract the actual auth data from the API response
      const authData = response.data?.data || response.data;
      
      // Ensure we have the expected structure
      if (authData && authData.user && authData.token) {
        return { user: authData.user, token: authData.token };
      }
      
      // If structure is different, handle it appropriately
      return rejectWithValue('Invalid response format from server');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Registration failed');
    }
  }
);

export const registerSeller = createAsyncThunk<
  { user: User; token: string },
  RegisterData,
  { rejectValue: string }
>(
  'auth/registerSeller',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await agent.auth.registerSeller(userData);
      // Extract the actual auth data from the API response
      const authData = response.data?.data || response.data;
      
      // Ensure we have the expected structure
      if (authData && authData.user && authData.token) {
        return { user: authData.user, token: authData.token };
      }
      
      // If structure is different, handle it appropriately
      return rejectWithValue('Invalid response format from server');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Seller registration failed');
    }
  }
);

export const login = createAsyncThunk<
  { user: User; token: string },
  LoginCredentials,
  { rejectValue: string }
>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      debugger;
      const response = await agent.auth.login(credentials);
      // Extract the actual auth data from the API response
      const authData = response.data?.data || response.data;
      
      if (authData && authData.token) {
        localStorage.setItem('token', authData.token);
        // localStorage.setItem('user', JSON.stringify(authData.user));
        return { user: authData.user, token: authData.token };
      }
      
      return rejectWithValue('Invalid response format from server');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Login failed');
    }
  }
);

export const logout = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await agent.auth.logout();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (error: any) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return rejectWithValue(error.response?.data?.message || error.message || 'Logout failed');
    }
  }
);

export const changePassword = createAsyncThunk<
  void,
  ChangePasswordData,
  { rejectValue: string }
>(
  'auth/changePassword',
  async (passwordData, { rejectWithValue }) => {
    try {
      await agent.auth.changePassword(passwordData);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Password change failed');
    }
  }
);

// Helper function to get initial state from localStorage
const getInitialState = (): AuthState => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  let user: User | null = null;
  
  if (userStr) {
    try {
      user = JSON.parse(userStr);
    } catch {
      localStorage.removeItem('user');
    }
  }
  
  return {
    user,
    token,
    isAuthenticated: !!token && !!user,
    loading: false,
    error: null,
    isRegistering: false,
    isLoggingOut: false,
    passwordChangeLoading: false,
  };
};

const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialState(),
  reducers: {
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.isRegistering = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isRegistering = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.isRegistering = false;
        state.error = action.payload ?? 'Registration failed';
      })
      
      // Register Seller
      .addCase(registerSeller.pending, (state) => {
        state.isRegistering = true;
        state.error = null;
      })
      .addCase(registerSeller.fulfilled, (state, action) => {
        state.isRegistering = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(registerSeller.rejected, (state, action) => {
        state.isRegistering = false;
        state.error = action.payload ?? 'Seller registration failed';
      })
      
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Login failed';
        state.isAuthenticated = false;
      })
      
      // Logout
      .addCase(logout.pending, (state) => {
        state.isLoggingOut = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isLoggingOut = false;
        state.error = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isLoggingOut = false;
        // Don't set error for logout failures since we clear credentials anyway
      })
      
      // Change Password
      .addCase(changePassword.pending, (state) => {
        state.passwordChangeLoading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.passwordChangeLoading = false;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.passwordChangeLoading = false;
        state.error = action.payload ?? 'Password change failed';
      });
  },
});

export const { clearCredentials, clearError, setCredentials } = authSlice.actions;
export default authSlice.reducer;
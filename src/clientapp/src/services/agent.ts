import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { store } from '../store/configureStore';
import { clearCredentials } from '../store/slices/authSlice';
import { CreatePromotionRequest } from '../types/admin';
import { ApiResponse, PaginationParams } from '../types/api';
import { RegisterData, LoginCredentials, ChangePasswordData } from '../types/auth';
import { AddToCartRequest, UpdateCartItemRequest } from '../types/cart';
import { Order, CheckoutData } from '../types/order';
import { Category, ProductFilters, Product } from '../types/product';
import { CreateReviewRequest } from '../types/review';

// API base URL (set according to your backend environment)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add bearer token
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // Add token to headers if it exists
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add timestamp to prevent caching
    config.params = {
      ...config.params,
      _t: new Date().getTime(),
    };
    
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`✅ API Response: ${response.status} ${response.config?.url}`);
    return response;
  },
  (error: AxiosError) => {
    const { response, request, config } = error;
    
    console.error(`❌ API Error: ${config?.method?.toUpperCase()} ${config?.url}`, error);
    
    if (response) {
      const { status, data } = response;
      
      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          console.warn('🔐 Unauthorized access - clearing credentials');
          localStorage.removeItem('token');
          store.dispatch(clearCredentials());
          
          // Redirect to login page (avoid redirect on login/register endpoints)
          if (!config?.url?.includes('/auth/')) {
            window.location.href = '/login';
          }
          break;
          
        case 403:
          // Forbidden - user doesn't have permission
          console.warn('🚫 Forbidden access');
          break;
          
        case 404:
          // Not found
          console.warn('📭 Resource not found');
          break;
          
        case 422:
          // Validation error
          console.warn('⚠️ Validation error:', data);
          break;
          
        case 500:
          // Server error
          console.error('💥 Internal server error');
          break;
          
        default:
          console.error(`🔥 HTTP Error ${status}:`, data);
      }
    } else if (request) {
      // No response received
      console.error('📡 No response received:', request);
    } else {
      // Request setup error
      console.error('⚙️ Request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// API methods with proper TypeScript typing
interface AdminAPI {
  dashboard: () => Promise<AxiosResponse<ApiResponse>>;
  users: (page?: number, pageSize?: number) => Promise<AxiosResponse<ApiResponse>>;
  updateUserStatus: (userId: string, body: { isActive: boolean }) => Promise<AxiosResponse<ApiResponse>>;
  orders: (page?: number, pageSize?: number) => Promise<AxiosResponse<ApiResponse>>;
  addPromotion: (body: CreatePromotionRequest) => Promise<AxiosResponse<ApiResponse>>;
  salesAnalytics: (startDate: string, endDate: string) => Promise<AxiosResponse<ApiResponse>>;
}

interface AuthAPI {
  register: (body: RegisterData) => Promise<AxiosResponse<ApiResponse>>;
  registerSeller: (body: RegisterData) => Promise<AxiosResponse<ApiResponse>>;
  login: (body: LoginCredentials) => Promise<AxiosResponse<ApiResponse>>;
  logout: () => Promise<AxiosResponse<ApiResponse>>;
  changePassword: (body: ChangePasswordData) => Promise<AxiosResponse<ApiResponse>>;
}

interface CartAPI {
  get: () => Promise<AxiosResponse<ApiResponse>>;
  clear: () => Promise<AxiosResponse<ApiResponse>>;
  addItem: (body: AddToCartRequest) => Promise<AxiosResponse<ApiResponse>>;
  updateItem: (cartItemId: string, body: UpdateCartItemRequest) => Promise<AxiosResponse<ApiResponse>>;
  removeItem: (cartItemId: string) => Promise<AxiosResponse<ApiResponse>>;
  total: () => Promise<AxiosResponse<ApiResponse>>;
}

interface CategoriesAPI {
  getAll: () => Promise<AxiosResponse<ApiResponse<Category[]>>>;
  add: (body: Partial<Category>) => Promise<AxiosResponse<ApiResponse<Category>>>;
  get: (id: string) => Promise<AxiosResponse<ApiResponse<Category>>>;
  update: (id: string, body: Partial<Category>) => Promise<AxiosResponse<ApiResponse<Category>>>;
  delete: (id: string) => Promise<AxiosResponse<ApiResponse>>;
  subcategories: (id: string) => Promise<AxiosResponse<ApiResponse<Category[]>>>;
}

interface NotificationsAPI {
  getAll: () => Promise<AxiosResponse<ApiResponse>>;
  markRead: (id: string) => Promise<AxiosResponse<ApiResponse>>;
  markAllRead: () => Promise<AxiosResponse<ApiResponse>>;
}

interface OrdersAPI {
  getAll: () => Promise<AxiosResponse<ApiResponse<Order[]>>>;
  get: (id: string) => Promise<AxiosResponse<ApiResponse<Order>>>;
  checkout: (body: CheckoutData) => Promise<AxiosResponse<ApiResponse>>;
  payment: (id: string, body: { paymentIntentId: string }) => Promise<AxiosResponse<ApiResponse>>;
  cancel: (id: string) => Promise<AxiosResponse<ApiResponse>>;
  updateStatus: (id: string, body: { status: string }) => Promise<AxiosResponse<ApiResponse>>;
  adminGet: (id: string) => Promise<AxiosResponse<ApiResponse<Order>>>;
}

interface ProductsAPI {
  getAll: (params?: ProductFilters & PaginationParams) => Promise<AxiosResponse<ApiResponse<Product[]>>>;
  add: (body: Partial<Product>) => Promise<AxiosResponse<ApiResponse<Product>>>;
  get: (id: string) => Promise<AxiosResponse<ApiResponse<Product>>>;
  update: (id: string, body: Partial<Product>) => Promise<AxiosResponse<ApiResponse<Product>>>;
  delete: (id: string) => Promise<AxiosResponse<ApiResponse>>;
  featured: () => Promise<AxiosResponse<ApiResponse<Product[]>>>;
  related: (id: string) => Promise<AxiosResponse<ApiResponse<Product[]>>>;
  search: (query: string, filters?: ProductFilters) => Promise<AxiosResponse<ApiResponse<Product[]>>>;
  byCategory: (categoryId: string, params?: ProductFilters) => Promise<AxiosResponse<ApiResponse<Product[]>>>;
}

interface ReviewsAPI {
  getForProduct: (productId: string, page?: number, pageSize?: number) => Promise<AxiosResponse<ApiResponse>>;
  add: (body: CreateReviewRequest) => Promise<AxiosResponse<ApiResponse>>;
  approve: (id: string) => Promise<AxiosResponse<ApiResponse>>;
  delete: (id: string) => Promise<AxiosResponse<ApiResponse>>;
  getAll: (page?: number, pageSize?: number) => Promise<AxiosResponse<ApiResponse>>;
  getByUser: (userId: string) => Promise<AxiosResponse<ApiResponse>>;
}

interface WishlistAPI {
  get: () => Promise<AxiosResponse<ApiResponse>>;
  addItem: (productId: string) => Promise<AxiosResponse<ApiResponse>>;
  removeItem: (productId: string) => Promise<AxiosResponse<ApiResponse>>;
  clear: () => Promise<AxiosResponse<ApiResponse>>;
  isInWishlist: (productId: string) => Promise<AxiosResponse<ApiResponse<boolean>>>;
}

interface Agent {
  admin: AdminAPI;
  auth: AuthAPI;
  cart: CartAPI;
  categories: CategoriesAPI;
  notifications: NotificationsAPI;
  orders: OrdersAPI;
  products: ProductsAPI;
  reviews: ReviewsAPI;
  wishlist: WishlistAPI;
}

const agent: Agent = {
  admin: {
    dashboard: () => axiosInstance.get('/api/Admin/dashboard'),
    users: (page = 1, pageSize = 10) => 
      axiosInstance.get('/api/Admin/users', { params: { page, pageSize } }),
    updateUserStatus: (userId: string, body: { isActive: boolean }) =>
      axiosInstance.put(`/api/Admin/users/${userId}/status`, body),
    orders: (page = 1, pageSize = 10) => 
      axiosInstance.get('/api/Admin/orders', { params: { page, pageSize } }),
    addPromotion: (body: CreatePromotionRequest) => 
      axiosInstance.post('/api/Admin/promotions', body),
    salesAnalytics: (startDate: string, endDate: string) =>
      axiosInstance.get('/api/Admin/analytics/sales', { params: { startDate, endDate } }),
  },
  auth: {
    register: (body: RegisterData) => axiosInstance.post('/api/Auth/register', body),
    registerSeller: (body: RegisterData) => axiosInstance.post('/api/Auth/register/seller', body),
    login: (body: LoginCredentials) => axiosInstance.post('/api/Auth/login', body),
    logout: () => axiosInstance.post('/api/Auth/logout'),
    changePassword: (body: ChangePasswordData) => axiosInstance.post('/api/Auth/change-password', body),
  },
  cart: {
    get: () => axiosInstance.get('/api/Cart'),
    clear: () => axiosInstance.delete('/api/Cart'),
    addItem: (body: AddToCartRequest) => axiosInstance.post('/api/Cart/items', body),
    updateItem: (cartItemId: string, body: UpdateCartItemRequest) => 
      axiosInstance.put(`/api/Cart/items/${cartItemId}`, body),
    removeItem: (cartItemId: string) => axiosInstance.delete(`/api/Cart/items/${cartItemId}`),
    total: () => axiosInstance.get('/api/Cart/total'),
  },
  categories: {
    getAll: () => axiosInstance.get('/api/Categories'),
    add: (body: Partial<Category>) => axiosInstance.post('/api/Categories', body),
    get: (id: string) => axiosInstance.get(`/api/Categories/${id}`),
    update: (id: string, body: Partial<Category>) => axiosInstance.put(`/api/Categories/${id}`, body),
    delete: (id: string) => axiosInstance.delete(`/api/Categories/${id}`),
    subcategories: (id: string) => axiosInstance.get(`/api/Categories/${id}/subcategories`),
  },
  notifications: {
    getAll: () => axiosInstance.get('/api/Notifications'),
    markRead: (id: string) => axiosInstance.put(`/api/Notifications/${id}/read`),
    markAllRead: () => axiosInstance.put('/api/Notifications/mark-all-read'),
  },
  orders: {
    getAll: () => axiosInstance.get('/api/Orders'),
    get: (id: string) => axiosInstance.get(`/api/Orders/${id}`),
    checkout: (body: CheckoutData) => axiosInstance.post('/api/Orders/checkout', body),
    payment: (id: string, body: { paymentIntentId: string }) => 
      axiosInstance.post(`/api/Orders/${id}/payment`, body),
    cancel: (id: string) => axiosInstance.post(`/api/Orders/${id}/cancel`),
    updateStatus: (id: string, body: { status: string }) => 
      axiosInstance.put(`/api/Orders/${id}/status`, body),
    adminGet: (id: string) => axiosInstance.get(`/api/Orders/admin/${id}`),
  },
  products: {
    getAll: (params?: ProductFilters & PaginationParams) => 
      axiosInstance.get('/api/Products', { params }),
    add: (body: Partial<Product>) => axiosInstance.post('/api/Products', body),
    get: (id: string) => axiosInstance.get(`/api/Products/${id}`),
    update: (id: string, body: Partial<Product>) => axiosInstance.put(`/api/Products/${id}`, body),
    delete: (id: string) => axiosInstance.delete(`/api/Products/${id}`),
    featured: () => axiosInstance.get('/api/Products/featured'),
    related: (id: string) => axiosInstance.get(`/api/Products/${id}/related`),
    search: (query: string, filters?: ProductFilters) => 
      axiosInstance.get('/api/Products/search', { params: { q: query, ...filters } }),
    byCategory: (categoryId: string, params?: ProductFilters) => 
      axiosInstance.get(`/api/Products/category/${categoryId}`, { params }),
  },
  reviews: {
    getForProduct: (productId: string, page = 1, pageSize = 10) =>
      axiosInstance.get(`/api/Reviews/product/${productId}`, { params: { page, pageSize } }),
    add: (body: CreateReviewRequest) => axiosInstance.post('/api/Reviews', body),
    approve: (id: string) => axiosInstance.put(`/api/Reviews/${id}/approve`),
    delete: (id: string) => axiosInstance.delete(`/api/Reviews/${id}`),
    getAll: (page = 1, pageSize = 10) => 
      axiosInstance.get('/api/Reviews', { params: { page, pageSize } }),
    getByUser: (userId: string) => axiosInstance.get(`/api/Reviews/user/${userId}`),
  },
  wishlist: {
    get: () => axiosInstance.get('/api/Wishlist'),
    addItem: (productId: string) => axiosInstance.post(`/api/Wishlist/items/${productId}`),
    removeItem: (productId: string) => axiosInstance.delete(`/api/Wishlist/items/${productId}`),
    clear: () => axiosInstance.delete('/api/Wishlist'),
    isInWishlist: (productId: string) => axiosInstance.get(`/api/Wishlist/check/${productId}`),
  },
};

export default agent;
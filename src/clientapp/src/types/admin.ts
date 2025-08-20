import { User } from "./auth";
import { Order } from "./order";
import { Product } from "./product";

export interface DashboardData {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  lowStockProducts: Product[];
}

export interface Promotion {
  id: string;
  name: string;
  description: string;
  type: 'Percentage' | 'FixedAmount';
  value: number;
  minimumOrderAmount?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageLimit?: number;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePromotionRequest {
  name: string;
  description: string;
  type: 'Percentage' | 'FixedAmount';
  value: number;
  minimumOrderAmount?: number;
  startDate: string;
  endDate: string;
  usageLimit?: number;
}

export interface SalesAnalytics {
  salesByDay: Array<{
    date: string;
    sales: number;
    orders: number;
  }>;
  topProducts: Array<{
    product: Product;
    sales: number;
    quantity: number;
  }>;
}

export interface AdminState {
  dashboardData: DashboardData;
  dashboardLoading: boolean;
  dashboardError: string | null;
  users: User[];
  usersLoading: boolean;
  usersError: string | null;
  userUpdateLoading: boolean;
  totalUsers: number;
  usersPage: number;
  usersPageSize: number;
  orders: Order[];
  ordersLoading: boolean;
  ordersError: string | null;
  totalOrders: number;
  ordersPage: number;
  ordersPageSize: number;
  promotions: Promotion[];
  promotionCreateLoading: boolean;
  promotionError: string | null;
  salesAnalytics: SalesAnalytics;
  analyticsLoading: boolean;
  analyticsError: string | null;
  error: string | null;
}
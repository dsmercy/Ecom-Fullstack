export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'Info' | 'Success' | 'Warning' | 'Error';
  isRead: boolean;
  data?: Record<string, any>;
  createdAt: string;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markLoading: boolean;
  markAllLoading: boolean;
  error: string | null;
  isOpen: boolean;
  lastFetchTime: string | null;
}
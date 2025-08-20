import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import agent from '../../services/agent';
import { NotificationState, Notification } from '../../types/notification';

// Async thunks
export const fetchNotifications = createAsyncThunk<
  Notification[],
  void,
  { rejectValue: string }
>(
  'notifications/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await agent.notifications.getAll();
      return response.data.data || [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch notifications');
    }
  }
);

export const markNotificationAsRead = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  'notifications/markAsRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      await agent.notifications.markRead(notificationId);
      return notificationId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to mark notification as read');
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      await agent.notifications.markAllRead();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to mark all notifications as read');
    }
  }
);

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  markLoading: false,
  markAllLoading: false,
  error: null,
  isOpen: false,
  lastFetchTime: null,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    toggleNotificationPanel: (state) => {
      state.isOpen = !state.isOpen;
    },
    closeNotificationPanel: (state) => {
      state.isOpen = false;
    },
    openNotificationPanel: (state) => {
      state.isOpen = true;
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      const newNotification = action.payload;
      state.notifications.unshift(newNotification);
      if (!newNotification.isRead) {
        state.unreadCount += 1;
      }
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      const notificationId = action.payload;
      const notification = state.notifications.find(n => n.id === notificationId);
      if (notification && !notification.isRead) {
        state.unreadCount -= 1;
      }
      state.notifications = state.notifications.filter(n => n.id !== notificationId);
    },
    updateUnreadCount: (state) => {
      state.unreadCount = state.notifications.filter(n => !n.isRead).length;
    },
    markAsReadLocally: (state, action: PayloadAction<string>) => {
      const notificationId = action.payload;
      const notification = state.notifications.find(n => n.id === notificationId);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsReadLocally: (state) => {
      state.notifications.forEach(notification => {
        notification.isRead = true;
      });
      state.unreadCount = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload;
        state.unreadCount = state.notifications.filter(n => !n.isRead).length;
        state.lastFetchTime = new Date().toISOString();
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch notifications';
      })
      
      // Mark Notification as Read
      .addCase(markNotificationAsRead.pending, (state) => {
        state.markLoading = true;
        state.error = null;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        state.markLoading = false;
        const notificationId = action.payload;
        const notification = state.notifications.find(n => n.id === notificationId);
        if (notification && !notification.isRead) {
          notification.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.markLoading = false;
        state.error = action.payload || 'Failed to mark notification as read';
      })
      
      // Mark All Notifications as Read
      .addCase(markAllNotificationsAsRead.pending, (state) => {
        state.markAllLoading = true;
        state.error = null;
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.markAllLoading = false;
        state.notifications.forEach(notification => {
          notification.isRead = true;
        });
        state.unreadCount = 0;
      })
      .addCase(markAllNotificationsAsRead.rejected, (state, action) => {
        state.markAllLoading = false;
        state.error = action.payload || 'Failed to mark all notifications as read';
      });
  },
});

export const {
  clearError,
  toggleNotificationPanel,
  closeNotificationPanel,
  openNotificationPanel,
  addNotification,
  removeNotification,
  updateUnreadCount,
  markAsReadLocally,
  markAllAsReadLocally,
} = notificationSlice.actions;

export default notificationSlice.reducer;
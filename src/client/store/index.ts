import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";

// Sample slice for user management
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";



// User slice
interface UserState {
  id: string | null;
  email: string | null;
  name: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

const initialUserState: UserState = {
  id: null,
  email: null,
  name: null,
  isAuthenticated: false,
  loading: false,
};

const userSlice = createSlice({
  name: "user",
  initialState: initialUserState,
  reducers: {
    setUser: (
      state,
      action: PayloadAction<{
        id: string;
        email: string;
        name: string;
      }>
    ) => {
      state.id = action.payload.id;
      state.email = action.payload.email;
      state.name = action.payload.name;
      state.isAuthenticated = true;
      state.loading = false;
    },
    clearUser: (state) => {
      state.id = null;
      state.email = null;
      state.name = null;
      state.isAuthenticated = false;
      state.loading = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

// App slice for general app state
interface AppState {
  theme: "light" | "dark";
  sidebarOpen: boolean;
  notifications: Array<{
    id: string;
    type: "success" | "error" | "warning" | "info";
    message: string;
    timestamp: number;
  }>;
}

const initialAppState: AppState = {
  theme: "light",
  sidebarOpen: false,
  notifications: [],
};

const appSlice = createSlice({
  name: "app",
  initialState: initialAppState,
  reducers: {
    setTheme: (state, action: PayloadAction<"light" | "dark">) => {
      state.theme = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    addNotification: (
      state,
      action: PayloadAction<{
        type: "success" | "error" | "warning" | "info";
        message: string;
      }>
    ) => {
      state.notifications.push({
        id: Date.now().toString(),
        ...action.payload,
        timestamp: Date.now(),
      });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
});

// Export actions
export const { setUser, clearUser, setLoading } = userSlice.actions;

export const {
  setTheme,
  toggleSidebar,
  setSidebarOpen,
  addNotification,
  removeNotification,
  clearNotifications,
} = appSlice.actions;

// Configure store
export const store = configureStore({
  reducer: {
    user: userSlice.reducer,
    app: appSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

// Setup listeners for refetchOnFocus/refetchOnReconnect
setupListeners(store.dispatch);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
import {
  useDispatch,
  useSelector,
  type TypedUseSelectorHook,
} from "react-redux";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

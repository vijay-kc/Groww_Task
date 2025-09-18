'use client';

import { createContext, useContext, ReactNode } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ApiField } from '@/services/api'; // Import ApiField type

export interface Widget {
  id: string;
  type: 'table' | 'card' | 'chart';
  title: string;
  description?: string;
  apiEndpoint: string;
  selectedFields: ApiField[]; 
  config: {
    refreshInterval?: number;
    chartType?: 'line' | 'candlestick';
    timeInterval?: 'daily' | 'weekly' | 'monthly';
    cardType?: 'watchlist' | 'gainers' | 'performance' | 'financial';
    filters?: Record<string, any>;
  };
  position: { x: number; y: number; w: number; h: number };
  data?: any;
  lastUpdated?: number;
  isLoading?: boolean;
  error?: string;
}

export interface DashboardState {
  widgets: Widget[];
  isEditMode: boolean;
  selectedWidget: string | null;
  apiCache: Record<string, { data: any; timestamp: number; ttl: number }>;
  
  // Actions
  addWidget: (widget: Omit<Widget, 'id'>) => void;
  removeWidget: (id: string) => void;
  updateWidget: (id: string, updates: Partial<Widget>) => void;
  updateWidgetPosition: (id: string, position: Widget['position']) => void;
  setEditMode: (enabled: boolean) => void;
  setSelectedWidget: (id: string | null) => void;
  updateWidgetData: (id: string, data: any, error?: string) => void;
  refreshWidgetData: (id: string) => Promise<void>; //  Add refresh function
  getCachedData: (key: string) => any | null;
  setCachedData: (key: string, data: any, ttl?: number) => void;
  clearCache: () => void;
  exportDashboard: () => string;
  importDashboard: (config: string) => void;
}

const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      widgets: [],
      isEditMode: false,
      selectedWidget: null,
      apiCache: {},

      addWidget: (widget) => {
        const id = Date.now().toString();
        const newWidget = { ...widget, id };
        
        set((state) => ({
          widgets: [...state.widgets, newWidget]
        }));

        // ✅ FIXED: Auto-fetch data when widget is added
        setTimeout(() => {
          get().refreshWidgetData(id);
        }, 100);
      },

      removeWidget: (id) => {
        set((state) => ({
          widgets: state.widgets.filter((w) => w.id !== id),
          selectedWidget: state.selectedWidget === id ? null : state.selectedWidget
        }));
      },

      updateWidget: (id, updates) => {
        set((state) => ({
          widgets: state.widgets.map((w) => 
            w.id === id ? { ...w, ...updates } : w
          )
        }));
      },

      updateWidgetPosition: (id, position) => {
        set((state) => ({
          widgets: state.widgets.map((w) => 
            w.id === id ? { ...w, position } : w
          )
        }));
      },

      setEditMode: (enabled) => {
        set({ isEditMode: enabled, selectedWidget: enabled ? null : get().selectedWidget });
      },

      setSelectedWidget: (id) => {
        set({ selectedWidget: id });
      },

      updateWidgetData: (id, data, error) => {
        set((state) => ({
          widgets: state.widgets.map((w) => 
            w.id === id 
              ? { ...w, data, error, lastUpdated: Date.now(), isLoading: false }
              : w
          )
        }));
      },

      // ✅ NEW: Proper data fetching function
      refreshWidgetData: async (id: string) => {
        const widget = get().widgets.find(w => w.id === id);
        if (!widget) return;

        // Set loading state
        set((state) => ({
          widgets: state.widgets.map((w) => 
            w.id === id ? { ...w, isLoading: true, error: undefined } : w
          )
        }));

        try {
          // Dynamic import to avoid circular dependency
          const { fetchWidgetData } = await import('@/services/api');
          
          const data = await fetchWidgetData(
            widget.apiEndpoint,
            widget.selectedFields, // ✅ Now properly typed as ApiField[]
            widget.type
          );
          
          get().updateWidgetData(id, data);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data';
          get().updateWidgetData(id, null, errorMessage);
          console.error(`Widget ${id} data fetch failed:`, error);
        }
      },

      getCachedData: (key) => {
        const cached = get().apiCache[key];
        if (!cached) return null;
        
        const now = Date.now();
        if (now - cached.timestamp > cached.ttl) {
          // Cache expired, remove it
          set((state) => {
            const newCache = { ...state.apiCache };
            delete newCache[key];
            return { apiCache: newCache };
          });
          return null;
        }
        
        return cached.data;
      },

      setCachedData: (key, data, ttl = 300000) => { // Default 5 minutes TTL
        set((state) => ({
          apiCache: {
            ...state.apiCache,
            [key]: {
              data,
              timestamp: Date.now(),
              ttl
            }
          }
        }));
      },

      clearCache: () => {
        set({ apiCache: {} });
      },

      exportDashboard: () => {
        const { widgets } = get();
        return JSON.stringify({ widgets }, null, 2);
      },

      importDashboard: (config) => {
        try {
          const parsed = JSON.parse(config);
          if (parsed.widgets && Array.isArray(parsed.widgets)) {
            set({ widgets: parsed.widgets });
            
            // ✅ FIXED: Refresh data for all imported widgets
            setTimeout(() => {
              parsed.widgets.forEach((widget: Widget) => {
                get().refreshWidgetData(widget.id);
              });
            }, 100);
          }
        } catch (error) {
          console.error('Failed to import dashboard:', error);
        }
      }
    }),
    {
      name: 'finance-dashboard',
      partialize: (state) => ({
        widgets: state.widgets,
        apiCache: state.apiCache
      })
    }
  )
);
// fixing
const DashboardContext = createContext<DashboardState | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const store = useDashboardStore();
  
  return (
    <DashboardContext.Provider value={store}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() :DashboardState {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within DashboardProvider');
  }
  return context;
}
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  theme: 'light' | 'dark'
  sidebarOpen: boolean
  currentModule: string
  notifications: Notification[]
  setTheme: (theme: 'light' | 'dark') => void
  toggleSidebar: () => void
  setCurrentModule: (module: string) => void
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
}

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      sidebarOpen: true,
      currentModule: 'dashboard',
      notifications: [],

      setTheme: (theme) => set({ theme }),
      
      toggleSidebar: () => set((state) => ({ 
        sidebarOpen: !state.sidebarOpen 
      })),
      
      setCurrentModule: (module) => set({ currentModule: module }),
      
      addNotification: (notification) => {
        const id = crypto.randomUUID()
        set((state) => ({
          notifications: [
            ...state.notifications,
            { ...notification, id }
          ]
        }))
        
        // Auto remove after 5s
        setTimeout(() => {
          get().removeNotification(id)
        }, 5000)
      },
      
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      })),
    }),
    {
      name: 'milapp-app',
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        currentModule: state.currentModule,
      }),
    }
  )
) 
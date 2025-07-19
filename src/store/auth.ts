import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/services/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      loading: true,

      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      },

      signUp: async (email, password) => {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
      },

      signOut: async () => {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        set({ user: null, session: null })
      },

      resetPassword: async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email)
        if (error) throw error
      },

      initialize: async () => {
        set({ loading: true })
        
        const { data: { session } } = await supabase.auth.getSession()
        set({ 
          user: session?.user ?? null,
          session,
          loading: false 
        })

        supabase.auth.onAuthStateChange((event, session) => {
          set({
            user: session?.user ?? null,
            session,
            loading: false,
          })
        })
      },
    }),
    {
      name: 'milapp-auth',
      partialize: (state) => ({ 
        user: state.user,
        session: state.session 
      }),
    }
  )
) 